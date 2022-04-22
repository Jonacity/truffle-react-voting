import React     from "react";
import Container from 'react-bootstrap/Container';
import Spinner   from 'react-bootstrap/Spinner';

const Loading = () => (
    <Container className="text-center">
        <br /> <br />
        <h2>Loading Web3, accounts, and contract...</h2>
        <Spinner animation="border" />
    </Container>
)

export default Loading;