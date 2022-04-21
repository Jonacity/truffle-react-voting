import React     from "react";
import Badge     from 'react-bootstrap/Badge';
import Navbar    from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

const Header = props => {
    const userAddress = props.userAddress;
    const userType = props.userType;

    return (
      <Navbar bg="light">
        <Container>
          <Navbar.Brand href="#home"><h1>Voting dApp</h1></Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
            {userAddress} | wallet connected as: <Badge bg="secondary">{userType}</Badge>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    )
  }

export default Header;