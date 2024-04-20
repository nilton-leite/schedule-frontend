import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Button, Collapse, Form, Table, Tooltip, OverlayTrigger } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';

function HealthInsurance() {
  const [isOpen, setIsOpen] = useState(false);
  const model = { healthInsuranceId: '', name: '', active: true };
  const [healthInsurance, setHealthInsurance] = useState(model);
  const [healthInsurances, setHealthInsurances] = useState([]);
  const [updatingData, setUpdatingData] = useState(false);

  useEffect(() => {
    getHealthInsurances();
  }, []);

  const sweetAlertHandler = (alert) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: alert.title,
      text: alert.text,
      icon: alert.icon,
      showCloseButton: true
    });
  };

  const getHealthInsurances = async () => {
    await axios
      .get(`${ENDPOINT.api}health-insurance`, ENDPOINT.config)
      .then((response) => {
        setHealthInsurances([...response.data.response].sort((a, b) => a.healthInsuranceId - b.healthInsuranceId));
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Planos de Saúde.' + err);
      });
  };

  const handleChange = (e) => {
    setHealthInsurance((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const submitEdit = (editItem) => {
    setIsOpen(true);
    setUpdatingData(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setHealthInsurance({ healthInsuranceId: editItem.healthInsuranceId, name: editItem.name, active: editItem.active });
  };

  const handleUpdate = async (e) => {
    const filteredData = healthInsurances.filter((item) => item.healthInsuranceId === healthInsurance.healthInsuranceId);
    const updatedData = {};

    for (const key in healthInsurance) {
      if (healthInsurance[key] !== filteredData[0][key]) {
        updatedData[key] = healthInsurance[key];
      }
    }

    if (Object.keys(updatedData).length > 0) submitUpdate(healthInsurance.healthInsuranceId, updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios
      .post(`${ENDPOINT.api}health-insurance`, { name: healthInsurance.name, active: healthInsurance.active }, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Plano de Saúde cadastrado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setHealthInsurance(model);
          getHealthInsurances();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Plano de Saúde.' + err);
      });
  };

  const submitUpdate = async (updateId, updatedData) => {
    await axios
      .patch(`${ENDPOINT.api}health-insurance/${updateId}`, updatedData, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Plano de Saúde alterado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setHealthInsurance(model);
          setUpdatingData(false);
          setIsOpen(false);
          getHealthInsurances();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar o Plano de Saúde.' + err);
      });
  };

  const handleClear = () => {
    setHealthInsurance(model);
    setUpdatingData(false);
  };

  return (
    <React.Fragment>
      <Row className="btn-page">
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Planos de Saúde</Card.Title>
              <span className="float-right">
                <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
                  <i className="feather icon-plus-circle" /> Cadastrar
                </Button>
              </span>
            </Card.Header>
            <Collapse in={isOpen}>
              <div id="basic-collapse">
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form onSubmit={handleSubmit}>
                        <Row>
                          <Col lg={12}>
                            <Form.Group controlId="active">
                              {/* <Form.Label>
                                Situação<span className="mandatory">*</span>
                              </Form.Label>
                              <br /> */}
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="active"
                                  checked={Boolean(healthInsurance.active)}
                                  value={healthInsurance.active}
                                  onChange={(e) =>
                                    setHealthInsurance((prevData) => ({
                                      ...prevData,
                                      active: !healthInsurance.active
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">{healthInsurance.active ? 'Cadastro Ativo' : 'Cadastro Inativo'}</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg={4}>
                            <Form.Group controlId="healthInsurance">
                              <Form.Label>Plano de Saúde{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="name"
                                type="text"
                                required={!updatingData}
                                placeholder="Digite aqui o nome do Plano de Saúde."
                                value={healthInsurance.name}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <hr />
                        <Row>
                          <Col lg={12}>
                            <div className="float-right">
                              {updatingData ? (
                                <Button variant="info" onClick={handleUpdate}>
                                  Salvar Alterações
                                </Button>
                              ) : (
                                <Button variant="primary" type="submit">
                                  Cadastrar
                                </Button>
                              )}
                              <Button variant="secundary" onClick={handleClear}>
                                Limpar
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Form>
                    </Col>
                  </Row>
                </Card.Body>
              </div>
            </Collapse>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col sm={12}></Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Nossos Planos de Saúde</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>
                      <center>Situação</center>
                    </th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {healthInsurances.map((item) => (
                    <tr key={item.healthInsuranceId}>
                      <td>{item.healthInsuranceId}</td>
                      <td>{item.name}</td>
                      <td>
                        <Form.Control
                          type="checkbox"
                          name="active"
                          checked={Boolean(item.active)}
                          value={Boolean(item.active)}
                          onChange={(e) => submitUpdate(item.healthInsuranceId, { active: !item.active })}
                        />
                        {/* 
                        <Form.Label className="cr">{item.active ? 'Ativo' : 'Inativo'}</Form.Label> */}
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={`tooltip-top`}>
                              Criado por {item.createdBy} em {item.createdAt}. Atualizado pela última vez em {item.updatedAt} por{' '}
                              {item.lastChangedBy}.{' '}
                            </Tooltip>
                          }
                        >
                          <i className="feather icon-info" />
                        </OverlayTrigger>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="light"
                          className="float-right mr-md"
                          onClick={() => {
                            submitEdit(item);
                          }}
                        >
                          <i className="feather icon-edit-2" /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default HealthInsurance;
