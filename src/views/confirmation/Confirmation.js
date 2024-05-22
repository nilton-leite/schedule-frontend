import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Collapse, Form } from 'react-bootstrap';
import InputMask from 'react-input-mask';
import Breadcrumb from '../../layouts/AdminLayout/Breadcrumb';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Brand from '../../assets/images/brand_blue.png';
import { ENDPOINT } from '../../config/constant';
import axios from 'axios';

const Confirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [patientDocument, setPatientDocument] = useState({ patient: '' });
  const [patientSchedule, setPatientSchedule] = useState([]);
  const [errors, setErrors] = useState({ error: false, msg: '' });

  const sweetAlertHandler = (alert) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: alert.title,
      text: alert.text,
      icon: alert.icon,
      showCloseButton: true
    });
  };

  useEffect(() => {});

  const handleChange = (e) => {
    setPatientDocument((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const getPatientSchedules = async () => {
    await axios
      .get(`${ENDPOINT.api}patients/phone/${patientDocument.patient.replace(/\D/g, '')}`, ENDPOINT.configunath)
      .then((response) => {
        if (response.data.response.schedules) {
          setPatientSchedule(response.data.response.schedules);
          setIsOpen(true);
        } else {
          sweetAlertHandler({
            text: 'Nenhuma consulta encontrada.',
            icon: 'warning',
            showCloseButton: true
          });
          sweetAlertHandler({
            text: 'Nenhuma consulta encontrada.',
            icon: 'warning',
            showCloseButton: true
          });
          setErrors({ error: true, msg: 'Nenhuma consulta encontrada.' });
        }
      })
      .catch((err) => {
        sweetAlertHandler({
          text: 'Nenhuma consulta encontrada.',
          icon: 'warning',
          showCloseButton: true
        });
        console.error('Não foi possível puxar os Pacientes.' + err);
      });
  };

  const updateSchedule = async (event, statusId) => {
    await axios
      .patch(`${ENDPOINT.api}schedules/confirmation/${patientSchedule.scheduleId}`, { statusId: statusId }, ENDPOINT.configunath)
      .then((response) => {
        if (response.data.statusCode === 200) {
          if (statusId === 4) {
            sweetAlertHandler({
              title: 'Tudo certo!',
              text: 'Consulta confirmada com sucesso.',
              icon: 'success',
              showCloseButton: true
            });
          } else {
            sweetAlertHandler({
              title: 'Tudo certo!',
              text: 'Consulta cancelada com sucesso.',
              icon: 'success',
              showCloseButton: true
            });
          }
          setPatientSchedule([]);
          setPatientDocument({ patient: '' });
          setIsOpen(false);
        } else {
          sweetAlertHandler({
            title: 'Poxa...',
            text: 'Erro ao alterar consulta. Entre em contato com a clínica.',
            icon: 'error',
            showCloseButton: true
          });
          console.log(response);
        }
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Pacientes.' + err);
      });
  };

  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content">
          <div className="auth-bg">
            <span className="r" />
            <span className="r s" />
            <span className="r s" />
            <span className="r" />
          </div>
          <Card className="borderless text-center">
            <Card.Body>
              <div>
                <img src={Brand} alt="Wambier" />
                <hr className="mt-4" />

                <Row className="m-t-20">
                  <Col lg={12} className="text-center">
                    Vamos confirmar sua consulta?
                    <br />
                    Primeiro, vamos confirmar seu Telefone:
                    <br />
                  </Col>
                  <Col lg={{ span: 8, offset: 2 }} md={{ span: 8, offset: 2 }} xs={{ span: 8, offset: 2 }} className="m-t-15">
                    <Form.Group controlId="patientDocument">
                      <InputMask
                        className="form-control"
                        name="patient"
                        type="text"
                        required
                        onChange={handleChange}
                        mask="(99) 99999-9999"
                        value={patientDocument.patient}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={{ span: 6, offset: 3 }} md={{ span: 6, offset: 3 }} xs={{ span: 6, offset: 3 }} className="m-b-5">
                    <Button variant="secundary" onClick={getPatientSchedules}>
                      {' '}
                      Buscar{' '}
                    </Button>
                  </Col>
                  <Col lg={{ span: 6, offset: 3 }} md={{ span: 6, offset: 3 }} xs={{ span: 6, offset: 3 }} className="m-b-5">
                    {errors.error ? errors.msg : ''}
                  </Col>
                </Row>

                <Collapse in={isOpen}>
                  <Row>
                    <Col lg={{ span: 8, offset: 2 }}>
                      <hr />
                      Consulta com o médico <span className="hljs-strong">{patientSchedule.doctorId}</span> no dia{' '}
                      <span className="hljs-strong">{patientSchedule.data}</span> às{' '}
                      <span className="hljs-strong">{patientSchedule.time}</span>.
                    </Col>
                    <Col lg={{ span: 8, offset: 2 }} className="m-t-20 m-b-10">
                      <Button variant="light" onClick={(event) => updateSchedule(event, 3)}>
                        {' '}
                        Cancelar{' '}
                      </Button>
                      <Button variant="primary" onClick={(event) => updateSchedule(event, 4)}>
                        Confirmar
                      </Button>
                    </Col>
                  </Row>
                </Collapse>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Confirmation;
