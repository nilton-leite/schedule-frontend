import React, { useContext } from 'react';
import { Link } from 'react-router-dom';

import NavRight from './NavRight';

import Logo from '../../../assets/images/brand_blue.png';
import LogoMobile from '../../../assets/images/logo-mobile.png';

import { ConfigContext } from '../../../contexts/ConfigContext';
import * as actionType from '../../../store/actions';
import useWindowSize from '../../../hooks/useWindowSize';

const NavBar = () => {
  //const [moreToggle, setMoreToggle] = useState(false);
  const windowSize = useWindowSize();
  const configContext = useContext(ConfigContext);
  const { collapseMenu, headerBackColor, headerFixedLayout, layout, subLayout } = configContext.state;
  const { dispatch } = configContext;

  let headerClass = ['navbar', 'pcoded-header', 'navbar-expand-lg', headerBackColor];
  if (headerFixedLayout && layout === 'vertical') {
    headerClass = [...headerClass, 'headerpos-fixed'];
  }

  let toggleClass = ['mobile-menu'];
  if (collapseMenu) {
    toggleClass = [...toggleClass, 'on'];
  }

  const navToggleHandler = () => {
    dispatch({ type: actionType.COLLAPSE_MENU });
  };

  // let moreClass = ['mob-toggler'];;
  // if (layout === 'horizontal') {
  //     moreClass = [...moreClass, 'd-none'];
  // }
  let collapseClass = ['collapse navbar-collapse'];
  // if (moreToggle) {
  //     //moreClass = [...moreClass, 'on'];
  //     collapseClass = [...collapseClass, 'd-block']
  // }

  let navBar = (
    <React.Fragment>
      <div className="m-header">
        <Link to="#" className={toggleClass.join(' ')} id="mobile-collapse" onClick={navToggleHandler}>
          <span />
        </Link>
        {windowSize.width < 992 ? (
          <Link to="#" className="b-brand">
            <img src={LogoMobile} alt="Wambier" />
          </Link>
        ) : (
          <Link to="/" className="b-brand">
            <img src={Logo} alt="Wambier" />
          </Link>
        )}
      </div>
      <div className={collapseClass.join(' ')}>
        <NavRight />
      </div>
    </React.Fragment>
  );

  if (layout === 'horizontal' && subLayout === 'horizontal-2') {
    navBar = <div className="container">{navBar}</div>;
  }

  return (
    <React.Fragment>
      <header className={headerClass.join(' ')}>{navBar}</header>
    </React.Fragment>
  );
};

export default NavBar;
