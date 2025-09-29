import type { JSX } from 'react'
import { Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { BullwhipPage } from './pages/Bullwhip'
import { DashboardPage } from './pages/Dashboard'
import { DemandPage } from './pages/Demand'
import { InventoryPage } from './pages/Inventory'
import { WhatIfPage } from './pages/WhatIf'

function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="demand" element={<DemandPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="bullwhip" element={<BullwhipPage />} />
        <Route path="what-if" element={<WhatIfPage />} />
      </Route>
    </Routes>
  )
}

export default App