import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { amplitude_taxonomy, logAmplitudeEvent } from '../utils/amplitude'
import { Tabs } from '@navikt/ds-react'

export interface TabLinkProps {
  children?: string | ReactNode
  to: string
  title?: string
  icon?: ReactNode
}

export function TabLink({ children, to, title, icon }: TabLinkProps) {
  const navigate = useNavigate()
  return (
    <Tabs.Tab
      value={to}
      label={children}
      icon={icon}
      data-href={to}
      onClick={() => {
        navigate(to)
        logAmplitudeEvent(amplitude_taxonomy.SAKSBILDE_BYTT_TAB, { tab: title })
      }}
    />
  )
}
