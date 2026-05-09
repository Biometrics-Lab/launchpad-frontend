// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import {Menu, MenuItem, MenuSection, SubMenu} from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 10 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/home' icon={<i className='ri-home-smile-line' />}>
          Dashboard
        </MenuItem>
        <MenuSection label='People'>
          <SubMenu label='People' icon={<i className='ri-group-line' />}>
            <MenuItem href='/organisations'>Organisations</MenuItem>
            <MenuItem href='/teams'>Teams</MenuItem>
            <MenuItem href='/players'>Players</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Assessments'>
          <SubMenu label='Assessments' icon={<i className='ri-clipboard-line' />}>
            <MenuItem href='/assessments'>Assessments</MenuItem>
            <MenuItem href='/assessment-templates'>Templates</MenuItem>
            <MenuItem href='/measurement'>Measurements</MenuItem>
            <MenuItem href='/metric'>Metrics</MenuItem>
            <MenuItem href='/data-sources'>Data Sources</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Reports'>
          <SubMenu label='Reports' icon={<i className='ri-line-chart-line' />}>
            <MenuItem href='/reports'>Reports</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Models'>
          <SubMenu label='Models' icon={<i className='ri-user-star-line' />}>
            <MenuItem href='/models'>Models</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Users'>
          <SubMenu label='Users' icon={<i className='ri-user-line' />}>
            <MenuItem href='/users'>Users</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Dictionaries'>
          <SubMenu label='Dictionaries' icon={<i className='ri-book-2-line' />}>
            <MenuItem href='/dictionaries/age-groups'>Age Groups</MenuItem>
            <MenuItem href='/dictionaries/data-source-types'>Data Source Types</MenuItem>
            <MenuItem href='/dictionaries/resource-types'>Resource Types</MenuItem>
            <MenuItem href='/dictionaries/sports'>Sports</MenuItem>
            <MenuItem href='/dictionaries/user-roles'>User Roles</MenuItem>
          </SubMenu>
        </MenuSection>
        <MenuSection label='Others'>
          <MenuItem href='/about' icon={<i className='ri-information-line' />}>
            About
          </MenuItem>
        </MenuSection>
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 10 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
