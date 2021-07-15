import React, { SVGProps } from 'react';

export interface IkonProps extends SVGProps<any> {
    height?: number;
    width?: number;
    viewBox?: string;
    className?: string;
}

export const Ikon: React.FC<IkonProps> = ({
    children,
    width = 16,
    height = 16,
    viewBox = '0 0 24 24',
    className,
    ...rest
}: IkonProps) => (
    <svg width={width} height={height} viewBox={viewBox} className={className} {...rest}>
        {children}
    </svg>
);
