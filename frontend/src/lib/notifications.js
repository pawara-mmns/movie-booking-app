import { toast } from 'react-toastify';

const getMessage = (value, fallback) => {
    if (typeof value === 'string' && value.trim()) return value;
    if (value?.message) return value.message;
    return fallback;
};

export const notify = {
    success: (message, options) => toast.success(message, options),
    info: (message, options) => toast.info(message, options),
    warning: (message, options) => toast.warning(message, options),
    error: (error, fallback = 'Something went wrong. Please try again.', options) => (
        toast.error(getMessage(error, fallback), options)
    ),
};
