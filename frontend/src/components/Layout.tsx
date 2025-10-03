import type { JSX } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
}

const navItems: NavItem[] = [
  { to: '/planner', label: 'Planner' },
  { to: '/supply-plans', label: 'Supply Plans' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/demand', label: 'Demand' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/bullwhip', label: 'Bullwhip' },
  { to: '/what-if', label: 'What-if' },
]

export function Layout(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <span className="brand">SupplyChainOS</span>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' nav-link--active' : ''}`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}