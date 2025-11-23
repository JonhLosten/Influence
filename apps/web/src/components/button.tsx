import React from "react";
import PropTypes from "prop-types";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // You can add any custom props here if needed
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-600/90 h-10 py-2 px-4 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

Button.propTypes = {
  className: PropTypes.string,
};
