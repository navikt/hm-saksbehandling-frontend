import React from 'react'

import { Ikon, IkonProps } from './Ikon'

export const Advarselikon: React.VFC<IkonProps> = ({ height = 16, width = 16, viewBox, className }) => (
  <Ikon height={height} width={width} viewBox={viewBox} className={className}>
    <g fill="none" fillRule="evenodd">
      <path
        d="M12.205-.004l-.214.002a12.225 12.225 0 00-8.517 3.659C1.179 5.977-.053 9.013.002 12.208c.115 6.613 5.296 11.793 11.795 11.793l.212-.002c6.726-.116 12.105-5.595 11.99-12.21C23.883 5.178 18.702-.003 12.204-.003z"
        fill="var(--navds-semantic-color-feedback-warning-icon)"
        fillRule="nonzero"
      />
      <path
        d="M12.027 19H12a1.499 1.499 0 01-.027-3H12a1.501 1.501 0 01.027 3z"
        fill="var(--navds-semantic-color-text)"
      />
      <path
        d="M12 5a1 1 0 011 1v7a1 1 0 01-2 0V6a1 1 0 011-1z"
        fill="var(--navds-semantic-color-text)"
        fillRule="nonzero"
      />
    </g>
  </Ikon>
)
