import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & {
    icon?: string;
    size?: number | string;
    color?: string;
};

export const Icon = ({ icon, size = 24, color = 'currentColor', ...props }: IconProps) => {
    const glyph = icon === 'IcAddBold' ? '+' : icon === 'IcCheckmark' ? '✓' : icon === 'IcChevronRight' ? '›' : icon === 'IcChevronDown' ? '⌄' : icon === 'IcClose' ? '×' : '';
    return (
        <svg aria-hidden='true' focusable='false' width={size} height={size} viewBox='0 0 24 24' fill='none' {...props}>
            {glyph ? <text x='12' y='17' textAnchor='middle' fontSize='18' fontWeight='700' fill={color}>{glyph}</text> : <circle cx='12' cy='12' r='8' stroke={color} strokeWidth='2' />}
        </svg>
    );
};
