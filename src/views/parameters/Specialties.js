import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Button, Collapse, Form, Table } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';

function Specialties() {
  const [isOpen, setIsOpen] = useState(false);
  const model = { specialtyId: '', name: '', description: '' };
  const [specialty, setSpecialty] = useState(model);
  const [specialties, setSpecialties] = useState([]);
  const [updatingData, setUpdatingData] = useState(false);

  useEffect(() => {
    getSpecialties();
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

  const getSpecialties = async () => {
    await axios
      .get(`${ENDPOINT.api}specialties`, ENDPOINT.config)
      .then((response) => {
        setSpecialties([...response.data.response].sort((a, b) => a.specialtyId - b.specialtyId));
      })
      .catch((err) => {
        console.error('Não foi possível puxar as especialidades.' + err);
      });
  };

  const handleChange = (e) => {
    setSpecialty((prevData) => ({
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
    setSpecialty({ specialtyId: editItem.specialtyId, name: editItem.name, description: editItem.description });
  };

  const handleUpdate = async (e) => {
    const filteredData = specialties.filter((item) => item.specialtyId === specialty.specialtyId);
    const updatedData = {};

    for (const key in specialty) {
      if (specialty[key] !== filteredData[0][key]) {
        updatedData[key] = specialty[key];
      }
    }

    if (Object.keys(updatedData).length > 0) submitUpdate(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios
      .post(`${ENDPOINT.api}specialties`, { name: specialty.name, description: specialty.description }, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Especialidade cadastrada com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setSpecialty(model);
          getSpecialties();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar a especialidade.' + err);
      });
  };

  const submitUpdate = async (updatedData) => {
    await axios
      .patch(`${ENDPOINT.api}specialties/${specialty.specialtyId}`, updatedData, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Especialidade alterada com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setSpecialty(model);
          setUpdatingData(false);
          setIsOpen(false);
          getSpecialties();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar a especialidade.' + err);
      });
  };

  const handleClear = () => {
    setSpecialty(model);
    setUpdatingData(false);
  };

  return (
    <React.Fragment>
      <Row className="btn-page">
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Especialidades</Card.Title>
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
                          <Col lg={4}>
                            <Form.Group controlId="specialty">
                              <Form.Label>Especialidade{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="name"
                                type="text"
                                required={!updatingData}
                                placeholder="Digite aqui o nome do especialidade."
                                value={specialty.name}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={6}>
                            <Form.Group controlId="description">
                              <Form.Label>Descrição{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="description"
                                type="text"
                                required={!updatingData}
                                placeholder="Descreva a especialidade."
                                value={specialty.description}
                                onChange={handleChange}
                              />

                              {/* <span className="text-c-darkred">* Campo obrigatório!</span> */}
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
              <Card.Title as="h5">Nossas Especialidades</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {specialties.map((item) => (
                    <tr key={item.specialtyId}>
                      <td>{item.specialtyId}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
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

export default Specialties;
