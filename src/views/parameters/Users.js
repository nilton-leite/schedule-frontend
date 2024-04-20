import React, { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import axios from 'axios';
import { Row, Col, Card, Button, Collapse, Form, Table } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';

function User() {
  const [isOpen, setIsOpen] = useState(false);
  const model = {
    userId: '',
    name: '',
    document: '',
    phone: '',
    dateBirth: '',
    password: '',
    active: true
  };
  const [user, setUser] = useState(model);
  const [users, setUsers] = useState([]);
  const [updatingData, setUpdatingData] = useState(false);

  useEffect(() => {
    getUsers();
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

  const getUsers = async () => {
    await axios
      .get(`${ENDPOINT.api}users`, ENDPOINT.config)
      .then((response) => {
        setUsers([...response.data.response].sort((a, b) => a.userId - b.userId));
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Usuários.' + err);
      });
  };

  const searchExistingUser = async () => {
    for (const [key, value] of Object.entries(users)) {
      if (value.document === user.document.replace(/\D/g, '')) {
        submitEdit(users[key]);
      }
    }
  };

  const handleChange = (e) => {
    setUser((prevData) => ({
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
    setUser({
      userId: editItem.userId,
      name: editItem.name,
      document: editItem.document,
      phone: editItem.phone,
      dateBirth: editItem.dateBirth.split('-').reverse().join(''),
      password: '',
      active: editItem.active
    });
  };

  const handleUpdate = async (e) => {
    const filteredData = users.filter((item) => item.userId === user.userId);
    const updatedData = {};

    for (const key in user) {
      if (user[key] !== filteredData[0][key]) {
        if (key !== 'dateBirth') {
          if (key === 'phone') {
            updatedData[key] = user[key].replace(/\D/g, '');
          } else {
            updatedData[key] = user[key];
          }
        }
      }
    }

    if (Object.keys(updatedData).length > 0) submitUpdate(user.userId, updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios
      .post(
        `${ENDPOINT.api}users`,
        {
          name: user.name,
          document: user.document.replace(/\D/g, ''),
          phone: user.phone.replace(/\D/g, ''),
          dateBirth: user.dateBirth.split('/').reverse().join('-'),
          password: user.password
        },
        ENDPOINT.config
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Usuário cadastrado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setUser(model);
          getUsers();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Usuário.' + err);
      });
  };

  const submitUpdate = async (updateId, updatedData) => {
    await axios
      .patch(`${ENDPOINT.api}users/${updateId}`, updatedData, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Usuário alterado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setUser(model);
          setUpdatingData(false);
          setIsOpen(false);
          getUsers();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar o Usuário.' + err);
      });
  };

  /* const consultaCEP = aync () => {
    

    await axios
    .patch(`https://h-apigateway.conectagov.estaleiro.serpro.gov.br/api-cep/v1/consulta/cep/${patient.}`)
    .then((response) => {
      console.log(response)
     
    })
    .catch((err) => {
      sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
      console.error('Não foi possível alterar o Usuário.' + err);
    });

  } */

  const handleClear = () => {
    setUser(model);
    setUpdatingData(false);
  };

  return (
    <React.Fragment>
      <Row className="btn-page">
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Usuários</Card.Title>
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
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="active"
                                  checked={Boolean(user.active)}
                                  value={user.active}
                                  onChange={(e) =>
                                    setUser((prevData) => ({
                                      ...prevData,
                                      active: !user.active
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">{user.active ? 'Cadastro Ativo' : 'Cadastro Inativo'}</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col lg={2}>
                            <Form.Group controlId="document">
                              <Form.Label>CPF{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <InputMask
                                className="form-control"
                                name="document"
                                type="text"
                                required={!updatingData}
                                mask="999.999.999-99"
                                disabled={updatingData}
                                value={user.document}
                                onBlur={searchExistingUser}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={4}>
                            <Form.Group controlId="user">
                              <Form.Label>Usuário{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="name"
                                type="text"
                                required={!updatingData}
                                placeholder="Digite aqui o nome do Usuário."
                                value={user.name}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="dateBirth">
                              <Form.Label>Data de Nascimento{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <InputMask
                                className="form-control"
                                name="dateBirth"
                                required={!updatingData}
                                mask="99/99/9999"
                                value={user.dateBirth}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="phone">
                              <Form.Label>Telefone{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <InputMask
                                className="form-control"
                                name="phone"
                                required={!updatingData}
                                mask="(99) 99999-9999"
                                placeholder="(99) 99999-9999"
                                value={user.phone}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="password">
                              <Form.Label>Senha{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <InputMask
                                className="form-control"
                                name="password"
                                type="password"
                                required={!updatingData}
                                value={user.password}
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
              <Card.Title as="h5">Nossos Usuários</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CPF</th>
                    <th>Nome</th>
                    <th>Data de Nascimento</th>
                    <th>Telefone</th>
                    <th>
                      <center>Situação</center>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.userId}>
                      <td>{item.userId}</td>
                      <td>
                        {item.document.toString().substr(0, 3)}.{item.document.toString().substr(3, 3)}.
                        {item.document.toString().substr(6, 3)}-{item.document.toString().substr(9)}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.dateBirth.split('-').reverse().join('/')}</td>
                      <td>
                        ({item.phone.toString().substr(0, 2)}) {item.phone.toString().substr(2, 5)}-{item.phone.toString().substr(7)}
                      </td>
                      <td>
                        <Form.Control
                          type="checkbox"
                          name="active"
                          checked={Boolean(item.active)}
                          value={Boolean(item.active)}
                          onChange={(e) => submitUpdate(item.userId, { active: !item.active })}
                        />
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

export default User;
