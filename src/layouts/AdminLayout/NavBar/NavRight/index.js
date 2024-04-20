import React, { useState, useEffect } from 'react';
import { ListGroup } from 'react-bootstrap';

import useAuth from '../../../../hooks/useAuth';

const NavRight = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      //handleClose();
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();

      let greeting;

      if (currentHour >= 0 && currentHour < 12) {
        greeting = 'Bom dia';
      } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Boa tarde';
      } else {
        greeting = 'Boa noite';
      }

      setTimeOfDay(greeting);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto p-lg" id="navbar-right">
        <ListGroup.Item as="li" bsPrefix=" ">
          <div className="input-group ">
            <span className="search-btn btn p-2">
              {/* <i className="feather icon-log-out mr-md" /> */} {timeOfDay},{' '}
              <span className="username">{window.localStorage.getItem('name')}</span>.
            </span>
          </div>
        </ListGroup.Item>
        <ListGroup.Item as="li" bsPrefix=" ">
          <div className="input-group ">
            <span className="search-btn btn p-2" onClick={handleLogout}>
              {/* <i className="feather icon-log-out mr-md" /> */} Sair
            </span>
          </div>
        </ListGroup.Item>
        {/*   <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown alignRight={!rtlLayout} className="drp-user">
            <Dropdown.Toggle as={Link} variant="link" to="#" id="dropdown-basic">
              <i className="icon feather icon-settings" />
            </Dropdown.Toggle>
            <Dropdown.Menu alignRight className="profile-notification">
              <div className="pro-head">
                <img src={avatar1} className="img-radius" alt="User Profile" />
                <span>John Doe</span>
                <Link to="#" className="dud-logout" title="Logout">
                  <i className="feather icon-log-out" />
                </Link>
              </div>
              <ListGroup as="ul" bsPrefix=" " variant="flush" className="pro-body">
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item">
                    <i className="feather icon-settings" /> Settings
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item">
                    <i className="feather icon-user" /> Profile
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item">
                    <i className="feather icon-mail" /> My Messages
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item">
                    <i className="feather icon-lock" /> Lock Screen
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item" onClick={}>
                    <i className="feather icon-log-out" /> Logout
                  </Link>
                </ListGroup.Item>
              </ListGroup>
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item> */}
      </ListGroup>
    </React.Fragment>
  );
};

export default NavRight;
