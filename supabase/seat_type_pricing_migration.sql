-- Run this in Supabase Dashboard > SQL Editor for an existing CineSphere database.
-- It keeps the old showtime price as the Standard/fallback price.

alter table public.showtimes
add column if not exists seat_prices jsonb not null default '{}'::jsonb;

update public.showtimes
set seat_prices = jsonb_build_object(
    'standard', price,
    'vip', price,
    'couple', price,
    'accessible', price
)
where seat_prices = '{}'::jsonb;

create or replace function public.create_booking(p_showtime_id bigint, p_seats jsonb)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
    v_user uuid := auth.uid();
    v_booking_id bigint;
    v_price integer;
    v_prices jsonb;
    v_layout jsonb;
    v_seat_type text;
    v_total integer := 0;
    v_reference text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    v_seat jsonb;
    v_row integer;
    v_col integer;
begin
    if v_user is null then raise exception 'Sign in before booking'; end if;
    if jsonb_typeof(p_seats) <> 'array' or jsonb_array_length(p_seats) not between 1 and 6 then
        raise exception 'Select between 1 and 6 seats';
    end if;

    select st.price, st.seat_prices, s.seat_configuration
    into v_price, v_prices, v_layout
    from public.showtimes st
    join public.screens s on s.id = st.screen_id
    where st.id = p_showtime_id and st.start_time > now()
    for update of st;
    if v_price is null then raise exception 'Showtime not found or already started'; end if;

    for v_seat in select value from jsonb_array_elements(p_seats)
    loop
        v_row := (v_seat ->> 'row')::integer;
        v_col := (v_seat ->> 'col')::integer;
        v_seat_type := v_layout -> v_row ->> v_col;
        v_seat_type := case v_seat_type
            when '1' then 'standard'
            when '2' then 'vip'
            else v_seat_type
        end;
        if v_seat_type is null or v_seat_type in ('gap', 'blocked', '0') then
            raise exception 'Invalid seat %-%', v_row, v_col;
        end if;
        if not exists (
            select 1 from public.seat_holds
            where showtime_id = p_showtime_id and seat_row = v_row and seat_col = v_col
              and user_id = v_user and expires_at > now()
        ) then raise exception 'Seat %-% hold expired; select it again', v_row, v_col; end if;

        v_total := v_total + coalesce(
            nullif(v_prices ->> v_seat_type, '')::integer,
            nullif(v_prices ->> 'standard', '')::integer,
            v_price
        );
    end loop;

    insert into public.bookings (user_id, showtime_id, total_price, status, booking_reference)
    values (v_user, p_showtime_id, v_total, 'CONFIRMED', v_reference)
    returning id into v_booking_id;

    for v_seat in select value from jsonb_array_elements(p_seats)
    loop
        v_row := (v_seat ->> 'row')::integer;
        v_col := (v_seat ->> 'col')::integer;
        insert into public.tickets (booking_id, showtime_id, seat_row, seat_col, seat_label)
        values (v_booking_id, p_showtime_id, v_row, v_col, chr(65 + v_row) || (v_col + 1)::text);
    end loop;

    delete from public.seat_holds where showtime_id = p_showtime_id and user_id = v_user;
    return jsonb_build_object(
        'status', 'confirmed',
        'booking_id', v_booking_id,
        'reference', v_reference,
        'total_price', v_total
    );
end;
$$;

revoke all on function public.create_booking(bigint, jsonb) from public, anon;
grant execute on function public.create_booking(bigint, jsonb) to authenticated;
