import React, { useState, useEffect, useContext } from 'react';
import InputMask from 'react-input-mask';
import { Row, Col, Card, Button, Collapse, Form, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import isValidCPF from '../../services/cpfvalidator';
import axios from 'axios';
import { LoadingContext } from '../../contexts/LoadingContext';
import Loader from '../../components/Loader/Loader';

function Schedule() {
  registerLocale('pt-BR', ptBR);
  const model = {
    data: `${new Date().getMonth() + 1}-${new Date().getDate()}-${new Date().getFullYear()}`,
    time: '',
    hasHealthInsurance: false,
    hasFirstQuery: false,
    statusId: 2,
    patientId: '',
    doctorId: '',
    scheduleTypeId: 1,
    obs: '',
    healthInsuranceId: ''
  };
  const modelPatient = {
    patientId: '',
    name: '',
    document: '',
    phone: '',
    acceptedMessage: true
  };
  const [isOpen, setIsOpen] = useState(true);
  const [updatingData, setUpdatingData] = useState(false);
  const [newSchedule, setNewSchedule] = useState(model);
  const [scheds, setScheds] = useState([]);
  const [schedsToday, setSchedsToday] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusSelection, setStatusSelection] = useState([]);
  const [doctorSelectedOption, setDoctorSelectedOption] = useState([]);
  const [patientSelectedOption, setPatientSelectedOption] = useState([]);
  const [statusSelectedOption, setStatusSelectedOption] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [isRegisterPatient, setIsRegisterPatient] = useState(false);
  const [patient, setPatient] = useState(modelPatient);
  const [exist, setExist] = useState(false);
  const [existingPatients, setExistingPatients] = useState([]);
  const [typeSelectedOption, setTypeSelectedOption] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [scheduleTypes, setScheduleTypes] = useState('');
  const [healthInsurances, setHealthInsurances] = useState([]);
  const [healthInsuranceSelectedOption, setHealthInsuranceSelectedOption] = useState([]);

  const { loading } = useContext(LoadingContext);

  useEffect(() => {
    getStatus();
    getPatients();
    getDoctors();
    getScheduleTypes();
    getSchedules();
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

  const CPFMask = (value) => {
    const cleanedValue = value.replace(/\D/g, '');

    let formattedValue = cleanedValue.slice(0, 3);
    if (cleanedValue.length > 3) formattedValue += `.${cleanedValue.slice(3, 6)}`;
    if (cleanedValue.length > 6) formattedValue += `.${cleanedValue.slice(6, 9)}`;
    if (cleanedValue.length > 9) formattedValue += `-${cleanedValue.slice(9, 11)}`;

    return formattedValue;
  };

  function formatDate(inputDate) {
    const parts = inputDate.split('-');
    const year = parts[2];
    const month = String(parseInt(parts[0], 10)).padStart(2, '0');
    const day = String(parseInt(parts[1], 10)).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const getTodaySchedules = async (schedulesfortoday) => {
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('/');
    const filteredItems = schedulesfortoday.filter((item) => item.data == today);
    setSchedsToday(filteredItems);
  };

  const getSchedules = async () => {
    await axios
      .get(`${ENDPOINT.api}schedules`, ENDPOINT.config)
      .then(async (response) => {
        getStatus();
        const newdata = await transformData(response.data.response);
        const orderednd = newdata.sort((a, b) => b.scheduleId - a.scheduleId);

        setScheds(orderednd);
        await getTodaySchedules(orderednd);
      })
      .catch((err) => {
        console.error('Não foi possível puxar as consultas.' + err);
      });
  };

  const getScheduleTypes = async () => {
    await axios
      .get(`${ENDPOINT.api}scheduleType`, ENDPOINT.config)
      .then((response) => {
        setScheduleTypes(
          response.data.response.map((item) => ({
            value: item.scheduleTypeId,
            label: `${item.description} `
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Pacientes.' + err);
      });
  };

  const getPatients = async () => {
    await axios
      .get(`${ENDPOINT.api}patients`, ENDPOINT.config)
      .then((response) => {
        setPatients(
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

  const getDoctors = async () => {
    await axios
      .get(`${ENDPOINT.api}doctors`, ENDPOINT.config)
      .then((response) => {
        setDoctors(
          response.data.response.map((item) => ({
            value: item.doctorId,
            label: item.name
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Médicos.' + err);
      });
  };

  const getStatus = async () => {
    await axios
      .get(`${ENDPOINT.api}status`, ENDPOINT.config)
      .then(async (response) => {
        await setStatusSelection(
          response.data.response.map((item) => ({
            value: item.statusId,
            label: item.description
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Status.' + err);
      });
  };

  const transformData = async (data) => {
    console.log('datraaa', data)
    const transformedData = [];

    await Promise.all(
      data.map(async (doctor) => {
        const { doctorId, name, schedules } = doctor;

        await Promise.all(
          schedules.map(async (schedule) => {
            const {
              scheduleId,
              data,
              time,
              statusId,
              hasFirstQuery,
              lastChangedBy,
              descriptionStatus,
              createdBy,
              createdAt,
              updatedAt,
              type,
              patients: { patientId, name: patientName }
            } = schedule;

            transformedData.push({
              scheduleId,
              doctorId,
              name,
              patientId,
              patientName,
              data,
              time,
              statusId,
              healthInsuranceId: schedule.healthInsurance && schedule.healthInsurance.healthInsuranceId ? schedule.healthInsurance.healthInsuranceId : null,
              statusName: descriptionStatus,
              lastChangedBy,
              createdBy,
              createdAt,
              updatedAt,
              type,
              hasFirstQuery: hasFirstQuery
            });
          })
        );
      })
    );

    return transformedData;
  };

  const handlePatientSelectChange = async (selected) => {
    setPatientSelectedOption(selected);
    setNewSchedule((prevData) => ({
      ...prevData,
      patientId: selected.value
    }));
  };

  const handleDoctorSelectChange = async (selected) => {
    setDoctorSelectedOption(selected);
    setNewSchedule((prevData) => ({
      ...prevData,
      doctorId: selected.value
    }));
  };

  const handleStatusSelectChange = async (selected) => {
    setStatusSelectedOption(selected);
    setNewSchedule((prevData) => ({
      ...prevData,
      statusId: selected.value
    }));
  };

  const handleTypeSelectChange = async (selected) => {
    setTypeSelectedOption(selected);
    setNewSchedule((prevData) => ({
      ...prevData,
      scheduleTypeId: selected.value
    }));
  };

  const handleDateSelectChange = (date) => {
    setScheduleDate(date);
    setNewSchedule((prevData) => ({
      ...prevData,
      data: `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
    }));
  };

  const handleChange = (e) => {
    setNewSchedule((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios
      .post(
        `${ENDPOINT.api}schedules`,
        {
          data: formatDate(newSchedule.data),
          time: newSchedule.time,
          hasHealthInsurance: newSchedule.healthInsuranceId !== '' && newSchedule.healthInsuranceId !== null ? true : false,
          hasFirstQuery: newSchedule.hasFirstQuery,
          statusId: 2,
          obs: newSchedule.obs,
          patientId: parseInt(newSchedule.patientId, 10),
          doctorId: parseInt(newSchedule.doctorId, 10),
          scheduleTypeId: newSchedule.scheduleTypeId,
          healthInsuranceId: newSchedule.healthInsuranceId !== '' &&  newSchedule.healthInsuranceId !== null ? newSchedule.healthInsuranceId : null
        },
        ENDPOINT.config
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Consulta cadastrado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setNewSchedule(model);
          setTypeSelectedOption('');
          setHealthInsuranceSelectedOption('');
          setDoctorSelectedOption('');
          setPatientSelectedOption('');
          getSchedules();
        } else {
          if (response.data.statusCode === 400) {
            sweetAlertHandler({ title: 'Poxa...', text: response.data.response, icon: 'error', showCloseButton: true });
          } else {
            sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
          }
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Consulta.' + err);
      });
  };

  const submitEdit = (editItem) => {
    console.log('editItem', editItem);
    setIsOpen(true);
    setUpdatingData(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setDoctorSelectedOption(doctors.find((option) => option.value === editItem.doctorId));
    setPatientSelectedOption(patients.find((option) => option.value === editItem.patientId));
    setStatusSelectedOption(statusSelection.find((option) => option.value === editItem.statusId));
    setTypeSelectedOption(scheduleTypes.find((option) => option.value === editItem.scheduleTypeId));
    setHealthInsuranceSelectedOption(healthInsurances.find((option) => option.value === editItem.healthInsuranceId));

    const [date] = editItem.data.split('T');
    const [day, month, year] = date.split('/');
    const dateInstance = new Date(year, month - 1, day);
    setScheduleDate(dateInstance);
    console.log('healthInsuranceSelectedOption', healthInsuranceSelectedOption);
    setNewSchedule({
      data: dateInstance,
      time: editItem.time,
      hasHealthInsurance: editItem.healthInsuranceId !== '' && editItem.healthInsuranceId !== null ? true : false,
      hasFirstQuery: editItem.hasFirstQuery,
      statusId: editItem.statusId,
      patientId: editItem.patientId,
      doctorId: editItem.doctorId,
      scheduleId: editItem.scheduleId,
      scheduleTypeId: editItem.scheduleTypeId,
      healthInsuranceId: editItem.healthInsuranceId,
    });
  };

  const handleUpdate = async (e) => {
    const filteredData = scheds.filter((item) => item.scheduleId === newSchedule.scheduleId);
    const updatedData = {};

    for (const key in newSchedule) {
        if (key === 'data') {
          if (newSchedule[key] instanceof Date) {
            updatedData[key] = `${newSchedule[key].getFullYear()}-${newSchedule[key].getMonth() + 1}-${newSchedule[key].getDate()}`;
          } else {
            formatDate(newSchedule[key]);
          }
        } else if (key !== 'scheduleId') {
          updatedData[key] = newSchedule[key];
        }
    }
    if (Object.keys(updatedData).length > 0) submitUpdate(newSchedule.scheduleId, updatedData);
  };

  const submitUpdate = async (updateId, updatedData) => {
    await axios
      .patch(`${ENDPOINT.api}schedules/${updateId}`, updatedData, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Consulta alterada com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setUpdatingData(false);
          setIsOpen(false);
          getSchedules();
          setNewSchedule(model);
        } else {
          if (response.data.statusCode === 400) {
            sweetAlertHandler({ title: 'Poxa...', text: response.data.response, icon: 'error', showCloseButton: true });
          } else {
            sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
          }
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível alterar a Consulta.' + err);
      });
  };

  const handlePatientSubmit = async () => {
    const patientJson = {
      name: patient.name,
      document: patient.document.replace(/\D/g, ''),
      phone: patient.phone.replace(/\D/g, ''),
      acceptedMessage: patient.acceptedMessage
    };

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
          setPatient(modelPatient);
          getPatients();
          handlePatientSelectChange({ value: response.data.response.patientId, label: response.data.response.name });
          setIsRegisterPatient(false);
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Paciente.' + err);
      });
  };

  const searchExistingPatient = async () => {
    if (isValidCPF(patient.document.replace(/\D/g, ''))) {
      for (const [key, value] of Object.entries(existingPatients)) {
        if (value.document === patient.document.replace(/\D/g, '')) {
          setPatient({
            patientId: existingPatients[key].patientId,
            name: existingPatients[key].name,
            document: existingPatients[key].document,
            phone: existingPatients[key].phone,
            acceptedMessage: existingPatients[key].acceptedMessage
          });

          handlePatientSelectChange({ value: existingPatients[key].patientId, label: existingPatients[key].name });
          setExist(true);
        } else {
          /* setPatient(modelPatient); */
        }
      }
    } else {
      sweetAlertHandler({ title: 'Poxa...', text: 'CPF Inválido.', icon: 'error', showCloseButton: true });
      setPatient(modelPatient);
    }
  };

  const handlePatientChange = (e) => {
    setPatient((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearch = (e) => {
    if (e.target.value == '') {
      getSchedules();
    }
    setSearchValue(e.target.value);
  };

  const filterSchedsToday = () => {
    const filtered = schedsToday.filter((item) => item.patientName.toLowerCase().includes(searchValue.toLowerCase()));
    setSchedsToday(filtered);
  };

  const filterScheds = () => {
    const filtered = scheds.filter((item) => item.patientName.toLowerCase().includes(searchValue.toLowerCase()));
    setScheds(filtered);
  };

  const handleClear = () => {
    setNewSchedule(model);
    setSchedsToday([]);
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

  const handleHealthInsuranceSelectChange = async (selected) => {
    setHealthInsuranceSelectedOption(selected);
    setNewSchedule((prevData) => ({
      ...prevData,
      healthInsuranceId: selected.value
    }));
  };

  return (
    <React.Fragment>
      {loading && (
        <div>
          <Loader />
        </div>
      )}
      <Row className="btn-page">
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Nova Consulta</Card.Title>
              <span className="float-right"></span>
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
                          <Col lg={12}>
                            <Form.Group controlId="acceptedMessage">
                              <Form.Label className="m-b-15">
                                Retorno?<span className="mandatory">*</span>
                              </Form.Label>
                              <br />
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="hasFirstQuery"
                                  checked={Boolean(newSchedule.hasFirstQuery)}
                                  value={newSchedule.hasFirstQuery}
                                  onChange={(e) =>
                                    setNewSchedule((prevData) => ({
                                      ...prevData,
                                      hasFirstQuery: !newSchedule.hasFirstQuery
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">{newSchedule.hasFirstQuery ? 'Sim' : 'Não'}</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="patientId">
                              <Form.Label>Tipo</Form.Label>

                              <Select
                                name="scheduleTypeId"
                                options={scheduleTypes}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Tipo"
                                value={typeSelectedOption}
                                onChange={handleTypeSelectChange}
                                isSearchable
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={3}>
                            <Form.Group controlId="patientId">
                              <Form.Label>Paciente</Form.Label>

                              <Select
                                name="patientId"
                                options={patients}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Digite aqui para procurar."
                                value={patientSelectedOption}
                                onChange={handlePatientSelectChange}
                                isSearchable
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={1}>
                            <Button
                              className="primary mt6"
                              onClick={() => {
                                setIsRegisterPatient(!isRegisterPatient);
                              }}
                            >
                              <i className="feather icon-plus-circle" />
                            </Button>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="doctorId">
                              <Form.Label>Médico</Form.Label>

                              <Select
                                name="doctorId"
                                options={doctors}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Selecione"
                                value={doctorSelectedOption}
                                onChange={handleDoctorSelectChange}
                                isSearchable
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="date">
                              <Form.Label>Data</Form.Label>

                              <DatePicker
                                name="data"
                                locale="pt-BR"
                                dateFormat="dd/MM/yyyy"
                                selected={scheduleDate}
                                minDate={new Date()}
                                onChange={handleDateSelectChange}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="time">
                              <Form.Label>Hora</Form.Label>

                              <InputMask
                                className="form-control"
                                name="time"
                                type="text"
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={newSchedule.time}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={6}>
                            <Form.Group controlId="time">
                              <Form.Label>Observação</Form.Label>

                              <InputMask
                                className="form-control"
                                name="obs"
                                type="text"
                                placeholder="Observações"
                                value={newSchedule.obs}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={3}>
                          <Form.Group controlId="insurances">
                            <Form.Label>Plano de Saúde</Form.Label>
                            <Select
                              name="insurances"
                              options={healthInsurances}
                              value={healthInsuranceSelectedOption}
                              className="basic-multi-select"
                              classNamePrefix="select"
                              placeholder="Selecione"
                              onChange={handleHealthInsuranceSelectChange}
                              isSearchable
                            />
                          </Form.Group>
                        </Col>
                          {updatingData ? (
                            <Col lg={3}>
                              <Form.Group controlId="statusSelection">
                                <Form.Label>Situação</Form.Label>

                                <Select
                                  name="status"
                                  options={statusSelection}
                                  className="basic-multi-select"
                                  classNamePrefix="select"
                                  placeholder="Selecione"
                                  value={statusSelectedOption}
                                  onChange={handleStatusSelectChange}
                                  isSearchable
                                />
                              </Form.Group>
                            </Col>
                          ) : (
                            ''
                          )}
                        </Row>
                        {isRegisterPatient ? (
                          <Row className="p-3">
                            <Col lg={12} className="mt-4">
                              Faça o cadastro simplificado do paciente:
                              <hr />
                            </Col>
                            <Col lg={2}>
                              <Form.Group controlId="document">
                                <Form.Label>CPF</Form.Label>

                                <InputMask
                                  className="form-control"
                                  name="document"
                                  type="text"
                                  required={true}
                                  mask="999.999.999-99"
                                  value={patient.document}
                                  onBlur={searchExistingPatient}
                                  onChange={handlePatientChange}
                                />
                              </Form.Group>
                            </Col>

                            <Col lg={4}>
                              <Form.Group controlId="patient">
                                <Form.Label>Paciente{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                                <Form.Control
                                  name="name"
                                  type="text"
                                  required={true}
                                  placeholder="Digite aqui o nome do Paciente."
                                  value={patient.name}
                                  onChange={handlePatientChange}
                                />
                              </Form.Group>
                            </Col>

                            <Col lg={2}>
                              <Form.Group controlId="phone">
                                <Form.Label>Telefone{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                                <InputMask
                                  className="form-control"
                                  name="phone"
                                  required={true}
                                  mask="(99) 99999-9999"
                                  placeholder="(99) 99999-9999"
                                  value={patient.phone}
                                  onChange={handlePatientChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col lg={3}>
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
                            <Col lg={1}>
                              <Button className="primary mt6 pull-right" disabled={exist} onClick={handlePatientSubmit}>
                                <i className="feather icon-check-circle" />
                              </Button>
                            </Col>
                          </Row>
                        ) : (
                          <hr />
                        )}
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
              <Card.Title as="h5">Consultas de Hoje</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="m-b-20">
                <Col lg={4}>
                  <Form.Group controlId="search">
                    <Form.Control
                      name="search"
                      type="text"
                      required
                      placeholder="Digite aqui o nome do paciente para buscar."
                      onChange={handleSearch}
                      onBlur={filterSchedsToday}
                      onKeyDown={function (e) {
                        if (e.key === 'Enter') {
                          filterSchedsToday();
                        }
                      }}
                      value={searchValue}
                    />
                  </Form.Group>
                </Col>
              </Row>
              {schedsToday && schedsToday.length > 0 ? (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tipo</th>
                      <th>Médico</th>
                      <th>Paciente</th>
                      <th>Data</th>
                      <th>Hora</th>
                      <th>Situação</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedsToday.map((item) => (
                      <tr key={item.scheduleId}>
                        <td>{item.scheduleId}</td>
                        <td>{item.type}</td>
                        <td>{item.name}</td>
                        <td>{item.patientName}</td>
                        <td>{item.data}</td>
                        <td>{item.time}</td>
                        <td>{item.statusName}</td>
                        <td>
                          {' '}
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
              ) : (
                <center>
                  <span>Nenhuma consulta encontrada para hoje.</span>
                </center>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Nossas Consultas</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="m-b-20">
                <Col lg={4}>
                  <Form.Group controlId="search">
                    <Form.Control
                      name="search"
                      type="text"
                      required
                      placeholder="Digite aqui o nome do paciente para buscar."
                      onChange={handleSearch}
                      onBlur={filterScheds}
                      onKeyDown={function (e) {
                        if (e.key === 'Enter') {
                          filterScheds();
                        }
                      }}
                      value={searchValue}
                    />
                  </Form.Group>
                </Col>
              </Row>
              {scheds && scheds.length > 0 ? (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tipo</th>
                      <th>Médico</th>
                      <th>Paciente</th>
                      <th>Data</th>
                      <th>Hora</th>
                      <th>Situação</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheds.map((item) => (
                      <tr key={item.scheduleId}>
                        <td>{item.scheduleId}</td>
                        <td>{item.type}</td>
                        <td>{item.name}</td>
                        <td>{item.patientName}</td>
                        <td>{item.data}</td>
                        <td>{item.time}</td>
                        <td>{item.statusName}</td>
                        <td>
                          {' '}
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
              ) : (
                <center>
                  <span>Nenhuma consulta encontrada.</span>
                </center>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default Schedule;
