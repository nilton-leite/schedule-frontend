import React from 'react';
import { useState, useEffect } from 'react';
import { Row, Col, Button, Modal, Form, Table, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { ENDPOINT } from '../../config/constant';

function FloatingButton() {
  const [connected, setConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const checkConnection = async () => {
    await axios
      .get(`${ENDPOINT.api}schedules/instance`, ENDPOINT.config)
      .then(async (response) => {
        if (response.data.response.response.result.state === 'disconnected') {
          setConnected(false);
          setQrCode(response.data.response.response.result.qrCode);
          setIsModalOpen(true);
        } else {
          setConnected(true);
        }
      })
      .catch((err) => {
        console.error('Não foi possível puxar a conexão.' + err);
      });
  };

  useEffect(() => {
    checkConnection();
    // const intervalId = setInterval(checkConnection, 3,6e+6);
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={styles.button}>
      {connected ? (
        <Button className="btn-icon btn-rounded">
          <i className="feather icon-toggle-right"></i>
        </Button>
      ) : (
        <Button
          className="btn-icon btn-warning btn-rounded"
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          <i className="feather icon-toggle-left"></i>
        </Button>
      )}

      <Modal centered size="lg" show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Conecte seu WhatsApp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col>
              <center>
                <img src={`data:image/jpeg;base64,${qrCode}`} />
              </center>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
}

const styles = {
  button: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '10px',
    cursor: 'pointer'
  }
};

export default FloatingButton;
