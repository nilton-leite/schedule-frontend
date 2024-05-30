import React, { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import axios from 'axios';
import { Row, Col, Card, Button, Collapse, Form, Modal, Table } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';
import Select from 'react-select';
import isValidCPF from '../../services/cpfvalidator';
import PaginationComponent from '../components/Pagination';

function Patient() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const model = {
    patientId: '',
    name: '',
    dateBirth: '',
    document: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    acceptedMessage: true,
    insurances: []
  };
  const [healthInsurances, setHealthInsurances] = useState([]);
  const [patient, setPatient] = useState(model);
  const [patients, setPatients] = useState([]);
  const [updatingData, setUpdatingData] = useState(false);
  const [healthSelected, setHealthSelected] = useState([]);
  const [modalData, setModalData] = useState(model);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [filterPatientSelectedOption, setFilterPatientSelectedOption] = useState(null);
  const [patientsFilter, setPatientsFilter] = useState([]);

  useEffect(() => {
    getPatients();
    getPatientsFilter();
    getHealthInsurances();
  }, []);

  const handleFilterPatientSelectChange = async (selected) => {
    setFilterPatientSelectedOption(selected);
  };

  const sweetAlertHandler = (alert) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: alert.title,
      text: alert.text,
      icon: alert.icon,
      showCloseButton: true
    });
  };

  const getPatientsFilter = async () => {
    await axios
      .get(`${ENDPOINT.api}patients`, ENDPOINT.config)
      .then((response) => {
        setPatientsFilter(
          response.data.response.map((item) => ({
            value: item.patientId,
            label: `(${item.phone}) ${item.name} `
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Pacientes.' + err);
      });
  };

  const filterPatients = async () => {
    getPatients();
  }

  const getPatients = async (pages) => {
    if (!pages) pages = page;
    setPage(pages);
    
    let query = `limit=10&page=${pages}`;
    if (filterPatientSelectedOption && filterPatientSelectedOption.value) query += `&patientId=${filterPatientSelectedOption.value}`;
    
    await axios
      .get(`${ENDPOINT.api}patients/list?${query}`, ENDPOINT.config)
      .then((response) => {
        setPatients([...response.data.response.patients].sort((a, b) => a.patientId - b.patientId));
        setCount(response.data.response.count);
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Pacientes.' + err);
      });
  };

  const getHealthInsurances = async () => {
    await axios
      .get(`${ENDPOINT.api}health-insurance`, ENDPOINT.config)
      .then((response) => {
        setHealthInsurances(
          response.data.response.map((item) => ({
            value: item.healthInsuranceId,
            label: item.name
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Planos de Saúde.' + err);
      });
  };

  const searchCEP = async () => {
    await axios
      .get(`https://viacep.com.br/ws/${patient.zipCode.replace(/\D/g, '')}/json/`)
      .then((response) => {
        if (response.erro) {
          console.log('erro ao buscar CEP');
          sweetAlertHandler({ title: 'Atenção...', text: 'Não encontramos esse CEP.', icon: 'warning', showCloseButton: true });
        } else {
          setPatient((prevData) => ({
            ...prevData,
            street: response.data.logradouro
          }));
        }
      })
      .catch((err) => {
        console.error('Não foi possível encontrar o CEP.' + err);
      });
  };

  const searchPatient = async (e) => {
    console.log(Object.values(patients).some((value) => typeof value === 'string' && value.includes(e.target.value)));
  };

  const searchExistingPatient = async () => {
    if (isValidCPF(patient.document.replace(/\D/g, ''))) {
      for (const [key, value] of Object.entries(patients)) {
        if (value.document === patient.document.replace(/\D/g, '')) {
          submitEdit(patients[key]);
        }
      }
    } else {
      sweetAlertHandler({ title: 'Poxa...', text: 'CPF Inválido.', icon: 'error', showCloseButton: true });
      setPatient(model);
    }
  };

  const handleSelectChange = async (selected) => {
    setHealthSelected(selected);
    setPatient((prevData) => ({
      ...prevData,
      insurances: selected
    }));
  };

  const modalPatientOpen = async (modalinfo) => {
    setModalData(modalinfo);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setPatient((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const submitEdit = (editItem) => {
    setIsOpen(true);
    setUpdatingData(true);
    setIsModalOpen(false);

    const arrayInsurance = editItem.patientHealthInsurance.map((item) => item.healthInsurance.healthInsuranceId);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setPatient({
      patientId: editItem.patientId,
      name: editItem.name,
      document: editItem.document,
      phone: editItem.phone,
      dateBirth: editItem.dateBirth.split('-').reverse().join(''),
      zipCode: editItem.zipCode,
      street: editItem.street,
      number: editItem.number,
      acceptedMessage: editItem.acceptedMessage,
      insurances: arrayInsurance
    });
    setHealthSelected(healthInsurances.filter((item) => arrayInsurance.includes(item.value)));
  };

  const handleUpdate = async (e) => {
    const filteredData = patients.filter((item) => item.patientId === patient.patientId);
    const updatedData = {};

    for (const key in patient) {
      if (patient[key] !== filteredData[0][key]) {
        if (key !== 'dateBirth') {
          if (key === 'phone') {
            updatedData[key] = patient[key].replace(/\D/g, '');
          } else {
            updatedData[key] = patient[key];
          }
        }
      }
    }

    if (Object.keys(updatedData).length > 0) submitUpdate(patient.patientId, updatedData);
  };

  const handleSubmit = async (e) => {
    const arrayInsurance = patient.insurances.map((item) => parseInt(item.value, 10));
    setPatient((prevData) => ({
      ...prevData,
      insurances: arrayInsurance
    }));

    const patientJson = {
      name: patient.name,
      phone: patient.phone.replace(/\D/g, ''),
      street: patient.street,
      number: patient.number,
      acceptedMessage: patient.acceptedMessage,
      insurances: arrayInsurance
    };

    if (patient.dateBirth !== '') {
      patientJson.dateBirth = patient.dateBirth.split('/').reverse().join('-');
    }

    if (patient.document !== '') {
      patientJson.document = patient.document.replace(/\D/g, '');
    }

    if (document.zipCode !== '') {
      patientJson.zipCode = patient.zipCode;
    }

    e.preventDefault();

    await axios
      .post(`${ENDPOINT.api}patients`, patientJson, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Paciente cadastrado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setPatient(model);
          getPatients();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: response.data.message, icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Paciente.' + err);
      });
  };

  const submitUpdate = async (updateId, updatedData) => {
    await axios
      .patch(`${ENDPOINT.api}patients/${updateId}`, updatedData, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Paciente alterado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setPatient(model);
          setUpdatingData(false);
          setIsOpen(false);
          getPatients();
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar o Paciente.' + err);
      });
  };

  /*   const searchCEP = async () => {
    await axios
      .get(`https://h-apigateway.conectagov.estaleiro.serpro.gov.br/api-cep/v1/consulta/cep/${patient.zipCode.replace(/-/g, '')}`)
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar o Usuário.' + err);
      });
  };
 */

  const handleSearch = (e) => {
    if (e.target.value == '') {
      getPatients();
    }
    setSearchValue(e.target.value);
  };

  const handleClear = () => {
    setPatient(model);
    setUpdatingData(false);
    setHealthSelected([]);
  };

  return (
    <React.Fragment>
      <Row className="btn-page">
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Pacientes</Card.Title>
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
                          <Col lg={12}></Col>
                        </Row>
                        <Row>
                          <Col lg={2}>
                            <Form.Group controlId="document">
                              <Form.Label>CPF</Form.Label>

                              <InputMask
                                className="form-control"
                                name="document"
                                type="text"
                                mask="999.999.999-99"
                                disabled={updatingData}
                                value={patient.document}
                                onBlur={searchExistingPatient}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={4}>
                            <Form.Group controlId="patient">
                              <Form.Label>Paciente{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="name"
                                type="text"
                                required={!updatingData}
                                placeholder="Digite aqui o nome do Paciente."
                                value={patient.name}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="dateBirth">
                              <Form.Label>Data de Nascimento</Form.Label>

                              <InputMask
                                className="form-control"
                                name="dateBirth"
                                mask="99/99/9999"
                                value={patient.dateBirth}
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
                                value={patient.phone}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="acceptedMessage">
                              <Form.Label className="m-b-15">
                                Aceita receber mensagens?<span className="mandatory">*</span>
                              </Form.Label>
                              <br />
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="acceptedMessage"
                                  checked={Boolean(patient.acceptedMessage)}
                                  value={patient.acceptedMessage}
                                  onChange={(e) =>
                                    setPatient((prevData) => ({
                                      ...prevData,
                                      acceptedMessage: !patient.acceptedMessage
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">{patient.acceptedMessage ? 'Sim' : 'Não'}</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="zipCode">
                              <Form.Label>CEP</Form.Label>

                              <InputMask
                                className="form-control"
                                name="zipCode"
                                mask="99999-999"
                                value={patient.zipCode}
                                onBlur={searchCEP}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={4}>
                            <Form.Group controlId="street">
                              <Form.Label>Endereço</Form.Label>

                              <Form.Control
                                name="street"
                                type="text"
                                required={!updatingData}
                                placeholder="Endereço"
                                value={patient.street}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={1}>
                            <Form.Group controlId="number">
                              <Form.Label>Número</Form.Label>

                              <Form.Control
                                name="number"
                                type="text"
                                required={!updatingData}
                                placeholder="Nº"
                                value={patient.number}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={3}>
                            <Form.Group controlId="insurances">
                              <Form.Label>Planos de Saúde{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Select
                                isMulti
                                name="insurances"
                                options={healthInsurances}
                                value={healthSelected}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Selecione"
                                onChange={handleSelectChange}
                                isSearchable
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
              <Card.Title as="h5">Nossos Pacientes</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="m-b-20">
                <Col lg={3}>
                    <Form.Group controlId="filterPatientId">
                      <Form.Label>Paciente</Form.Label>

                      <Select
                        name="filterPatientId"
                        options={patientsFilter}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Selecione"
                        value={filterPatientSelectedOption}
                        onChange={handleFilterPatientSelectChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            filterPatients();
                          }}
                        isSearchable
                        isClearable
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={1}>
                    <Button className="primary mt6 pull-right" onClick={() => {filterPatients()}}>
                      <i className="feather icon-search" />
                    </Button>
                  </Col>
              </Row>
              {patients && patients.length > 0 ? (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Data de Nascimento</th>
                      <th>Telefone</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((item) => (
                      <tr key={item.patientId}>
                        <td>{item.name}</td>
                        <td>{item.dateBirth == 'Invalid date' ? '' : item.dateBirth}</td>
                        <td>{item.phone}</td>
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
                        <td>
                          <Button
                            size="sm"
                            variant="primary"
                            className="float-right mr-md"
                            onClick={() => {
                              modalPatientOpen(item);
                            }}
                          >
                            <i className="feather icon-folder" /> Ficha Completa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <PaginationComponent page={page} count={count} handlePagination={getPatients}></PaginationComponent>
                </Table>
              ) : (
                <center>
                  <span>Nenhum paciente encontrado.</span>
                </center>
              )}
              <Modal centered size="xl" show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                <Modal.Header closeButton>
                  <Modal.Title as="h5">Ficha do Paciente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <h6>Dados do Paciente</h6>
                  <Row className="m-t-15">
                    <Col lg={2}>
                      <span className="modal-title">CPF</span>
                      <br />
                      {modalData.document}
                    </Col>
                    <Col lg={5}>
                      <span className="modal-title">Nome</span>
                      <br />
                      {modalData.name}
                    </Col>
                    <Col lg={3}>
                      <span className="modal-title">Data de Nascimento</span>
                      <br />
                      {modalData.dateBirth}
                    </Col>
                    <Col lg={2}>
                      <span className="modal-title">Telefone</span>
                      <br />
                      {modalData.phone}
                    </Col>
                  </Row>
                  <Row className="m-t-15">
                    <Col lg={2}>
                      <span className="modal-title">CEP</span>
                      <br />
                      {modalData.zipCode}
                    </Col>
                    <Col lg={5}>
                      <span className="modal-title">Endereço</span>
                      <br />
                      {modalData.street}, {modalData.number}
                    </Col>
                    <Col lg={3}>
                      <span className="modal-title">Aceita mensagem?</span>
                      <br />
                      {modalData.acceptedMessage ? 'Sim' : 'Não'}
                    </Col>
                  </Row>
                  <hr />
                  <h6>Histórico</h6>
                  {modalData.schedules && modalData.schedules.length > 0 ? (
                    <Table responsive hover size="sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Data</th>
                          <th>Hora</th>
                          <th>Médico</th>
                          <th>Retorno?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.schedules.map((item) => (
                          <tr key={item.scheduleId}>
                            <td>{item.scheduleId}</td>
                            <td>{item.data}</td>
                            <td>{item.time}</td>
                            <td>{item.doctorId}</td>
                            <td>{item.hasFistSchedule ? 'Não' : 'Sim'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <center>
                      <span>Não temos consultas para este paciente.</span>
                    </center>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button variant="primary" onClick={() => submitEdit(modalData)}>
                    Editar Cadastro
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default Patient;
