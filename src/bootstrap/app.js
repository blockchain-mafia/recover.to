import React from 'react'

import { Helmet } from 'react-helmet'
import loadable from '@loadable/component'
import { Router, navigate } from '@reach/router'
import styled from 'styled-components/macro'
import { ClimbingBoxLoader } from 'react-spinners'

import { register } from './service-worker'
import { ArchonInitializer } from './archon'
import drizzle from './drizzle'
import { DrizzleProvider, Initializer } from '../temp/drizzle-react-hooks'
import { ReactComponent as Logo } from '../assets/images/logo.svg'
import Identicon from '../components/identicon'

import '../components/theme.css'


const Main = ({ children }) => (
  <div className='App'>
    <header className='App-header'>
      <nav>
        <ul>
          <li>Recover</li>
          <li onClick={() => navigate('/')}>Home</li>
        </ul>
      </nav>
    </header>
    <main>
      {children}
    </main>
  </div>
)


const StyledMain = styled(Main)`
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const C404 = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/404'),
  {
    fallback: <ClimbingBoxLoader />
  }
)
const Home = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/home'),
  {
    fallback: <ClimbingBoxLoader />
  }
)

export default () => (
  <>
    <Helmet>
      <title>Recover.to · Lost and Found service</title>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500,500i,700,700i"
        rel="stylesheet"
      />
    </Helmet>
    <DrizzleProvider drizzle={drizzle}>
      <Initializer
        error={<C404 Web3 />}
        loadingContractsAndAccounts={<C404 Web3 />}
        loadingWeb3={<ClimbingBoxLoader />}
      >
        <ArchonInitializer>
          <Router>
            <Main path="/">
              <Home path="/" />
              <C404 default />
            </Main>
          </Router>
        </ArchonInitializer>
      </Initializer>
    </DrizzleProvider>
  </>
)

register({
  onUpdate: () =>
    <p>An update is ready to be installed. Please restart the application.</p>
})
