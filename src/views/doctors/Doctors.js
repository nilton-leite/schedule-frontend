import React, { useState, useEffect, useContext } from 'react';
import InputMask from 'react-input-mask';
import axios from 'axios';
import { Row, Col, Card, Button, Collapse, Form, Table, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { LoadingContext } from '../../contexts/LoadingContext';
import Loader from '../../components/Loader/Loader';

function Doctors() {
  const [isOpen, setIsOpen] = useState(false);
  const model = {
    doctorId: '',
    name: '',
    dateBirth: '',
    document: '',
    phone: '',
    numberTypeDoc: '',
    timeSendConfirmation: '',
    timePerQuery: '',
    specialties: [],
    insurances: [],
    workDays: []
  };
  const workModel = {
    seg: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    ter: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    quar: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    quin: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    sex: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    sab: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    },
    dom: {
      status: false,
      initMorning: '',
      finalMorning: '',
      initAfternoon: '',
      finalAfternoon: ''
    }
  };

  const tempAbsence = {
    observation: '',
    initDate: '',
    initTime: '',
    endDate: '',
    endTime: '',
    reasonTemporaryAbsenceId: '',
    doctorId: ''
  };

  const [temporaryAbsence, setTemporaryAbsence] = useState(tempAbsence);
  const [healthInsurances, setHealthInsurances] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctor, setDoctor] = useState(model);
  const [doctors, setDoctors] = useState([]);
  const [workDays, setWorkDays] = useState(workModel);
  const [updatingData, setUpdatingData] = useState(false);
  const [healthSelected, setHealthSelected] = useState([]);
  const [specialtySelected, setSpecialtySelected] = useState([]);
  const [openModalTemporary, setOpenModalTemporary] = useState(false);
  const [temporaryAbsences, setTemporaryAbsences] = useState([]);
  const [reasonTemporaryAbsences, setReasonTemporaryAbsences] = useState([]);
  const [reasonSelectedOption, setReasonSelectedOption] = useState('');
  const [initDate, setInitDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const { loading } = useContext(LoadingContext);

  useEffect(() => {
    getDoctors();
    getHealthInsurances();
    getSpecialties();
    getTAR();
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

  const getTA = async () => {
    await axios
      .get(`${ENDPOINT.api}temporaryAbsence?doctorId=${doctor.doctorId}`, ENDPOINT.config)
      .then((response) => {
        setTemporaryAbsences(response.data.response);
        console.log(response.data.response);
      })
      .catch((err) => {
        console.error('Não foi possível puxar as Ausências Temporárias.' + err);
      });
  };

  const getDoctors = async () => {
    await axios
      .get(`${ENDPOINT.api}doctors`, ENDPOINT.config)
      .then((response) => {
        setDoctors([...response.data.response].sort((a, b) => a.doctorId - b.doctorId));
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Médicos.' + err);
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

  const getSpecialties = async () => {
    await axios
      .get(`${ENDPOINT.api}specialties`, ENDPOINT.config)
      .then((response) => {
        setSpecialties(
          response.data.response.map((item) => ({
            value: item.specialtyId,
            label: item.name
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Planos de Saúde.' + err);
      });
  };

  const getTAR = async () => {
    await axios
      .get(`${ENDPOINT.api}reasonTemporaryAbsence`, ENDPOINT.config)
      .then((response) => {
        setReasonTemporaryAbsences(
          response.data.response.map((item) => ({
            value: item.reasonTemporaryAbsenceId,
            label: item.description
          }))
        );
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Motivos.' + err);
      });
  };

  const searchDoctor = async (e) => {
    console.log(e.target.value);
    console.log(Object.values(doctors).some((value) => typeof value === 'string' && value.includes(e.target.value)));
  };

  const searchExistingDoctor = async () => {
    for (const [key, value] of Object.entries(doctors)) {
      if (value.document === doctor.document.replace(/\D/g, '')) {
        /* submitEdit(doctors[key]); */
      }
    }
  };

  const handleInsuranceChange = async (selected) => {
    setHealthSelected(selected);
    setDoctor((prevData) => ({
      ...prevData,
      insurances: selected
    }));
  };

  const handleSpecialtyChange = async (selected) => {
    setSpecialtySelected(selected);
    setDoctor((prevData) => ({
      ...prevData,
      specialties: selected
    }));
  };

  const handleReasonChange = async (selected) => {
    setReasonSelectedOption(selected);
    setTemporaryAbsence((prevData) => ({
      ...prevData,
      reasonTemporaryAbsenceId: selected.value
    }));
  };

  const handleChange = (e) => {
    setDoctor((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleChangeTA = (e) => {
    setTemporaryAbsence((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleDateSelectChange = (date) => {
    setInitDate(date);
    setTemporaryAbsence((prevData) => ({
      ...prevData,
      initDate: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }));
  };

  const handleEndDateSelectChange = (date) => {
    setEndDate(date);
    setTemporaryAbsence((prevData) => ({
      ...prevData,
      endDate: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }));
  };

  const handleChangeWorkDays = (event, day) => {
    const { name, value } = event.target;
    setWorkDays((prevWorkDays) => ({
      ...prevWorkDays,
      [day]: {
        ...prevWorkDays[day],
        [name]: value
      }
    }));
  };

  const changeWorkDay = (event, day) => {
    const { checked } = event.target;

    setWorkDays((prevWorkDays) => ({
      ...prevWorkDays,
      [day]: {
        ...prevWorkDays[day],
        status: checked
      }
    }));
  };

  const submitEdit = (editItem) => {
    setIsOpen(true);
    setUpdatingData(true);
    const arrayInsurance = editItem.doctorHealthInsurance.map((item) => item.healthInsurance.healthInsuranceId);
    const arraySpecialties = editItem.doctorsSpecialties.map((item) => item.specialties.specialtyId);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setDoctor({
      doctorId: editItem.doctorId,
      name: editItem.name,
      document: editItem.document,
      phone: editItem.phone,
      dateBirth: editItem.dateBirth.split('-').reverse().join(''),
      timeSendConfirmation: editItem.timeSendConfirmation,
      timePerQuery: editItem.timePerQuery,
      type: 1,
      numberTypeDoc: editItem.numberTypeDoc,
      insurances: arrayInsurance,
      specialties: arraySpecialties,
      createdBy: editItem.createdBy,
      createdAt: editItem.createdAt,
      lastChangedBy: editItem.lastChangedBy,
      updatedAt: editItem.updatedAt,
      workDays: editItem.workDays
    });
    setHealthSelected(healthInsurances.filter((item) => arrayInsurance.includes(item.value)));
    setSpecialtySelected(specialties.filter((item) => arraySpecialties.includes(item.value)));
    setWorkDays(editItem.workDays);
  };

  const handleUpdate = async (e) => {
    submitUpdate(doctor.doctorId);
  };

  const handleSubmit = async (e) => {
    console.log('cheguei');
    const arrayInsurance = doctor.insurances.map((item) => parseInt(item.value, 10));
    const arraySpecialties = doctor.specialties.map((item) => parseInt(item.value, 10));
    setDoctor((prevData) => ({
      ...prevData,
      insurances: arrayInsurance
    }));

    /*  e.preventDefault(); */
    await axios
      .post(
        `${ENDPOINT.api}doctors`,
        {
          name: doctor.name,
          document: doctor.document.replace(/\D/g, ''),
          phone: doctor.phone.replace(/\D/g, ''),
          dateBirth: doctor.dateBirth.split('/').reverse().join('-'),
          timeSendConfirmation: doctor.timeSendConfirmation,
          timePerQuery: doctor.timePerQuery,
          type: 1,
          numberTypeDoc: doctor.numberTypeDoc,
          insurances: arrayInsurance,
          specialties: arraySpecialties,
          workDays: workDays
        },
        ENDPOINT.config
      )
      .then((response) => {
        console.log(response);
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Médico cadastrado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setDoctor(model);
          getDoctors();
          console.log('ok');
        } else {
          console.log(response.data);
          if (response.data.statusCode === 400) {
            sweetAlertHandler({ title: 'Poxa...', text: response.data.response, icon: 'error', showCloseButton: true });
            console.log(response.data);
          } else {
            sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
            console.log(response.data);
          }
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Médico.' + err);
      });
  };

  const submitUpdate = async (updateId, updatedData) => {
    const arrayInsurance = doctor.insurances.map((item) => parseInt(item.value, 10));
    const arraySpecialties = doctor.specialties.map((item) => parseInt(item.value, 10));
    await axios
      .patch(
        `${ENDPOINT.api}doctors/${updateId}`,
        {
          name: doctor.name,
          document: doctor.document.replace(/\D/g, ''),
          phone: doctor.phone.replace(/\D/g, ''),
          dateBirth: doctor.dateBirth.split('/').reverse().join('-'),
          timeSendConfirmation: doctor.timeSendConfirmation,
          timePerQuery: doctor.timePerQuery,
          type: 1,
          insurances: arrayInsurance,
          specialties: arraySpecialties,
          numberTypeDoc: doctor.numberTypeDoc,
          workDays: workDays
        },
        ENDPOINT.config
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Médico alterado com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setDoctor(model);
          setUpdatingData(false);
          setIsOpen(false);
          getDoctors();
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
        console.error('Não foi possível alterar o Médico.' + err);
      });
  };

  const openTemporary = async (e) => {
    getTA();

    setTemporaryAbsence((prevData) => ({
      ...prevData,
      doctorId: doctor.doctorId
    }));

    setOpenModalTemporary(true);
  };

  const deleteTA = async (id) => {
    await axios
      .delete(`${ENDPOINT.api}temporaryAbsence/${id}`, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Ausência deletada com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setOpenModalTemporary(false);
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel deletar.', icon: 'error', showCloseButton: true });
          console.log(response);
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel deletar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar.' + err);
      });
  };

  const handleSaveTA = async (e) => {
    console.log(temporaryAbsence);

    await axios
      .post(
        `${ENDPOINT.api}temporaryAbsence`,
        {
          observation: temporaryAbsence.observation,
          initDate: temporaryAbsence.initDate,
          initTime: temporaryAbsence.initTime,
          endDate: temporaryAbsence.endDate,
          endTime: temporaryAbsence.endTime,
          reasonTemporaryAbsenceId: temporaryAbsence.reasonTemporaryAbsenceId,
          doctorId: temporaryAbsence.doctorId
        },
        ENDPOINT.config
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Ausência cadastrada com sucesso.',
            icon: 'success',
            showCloseButton: true
          });
          setOpenModalTemporary(false);
          /* handleClear(); */
        } else {
          sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
          console.log(response);
        }
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar.' + err);
      });
  };

  const handleSearch = (e) => {
    if (e.target.value == '') {
      getDoctors();
    }
    setSearchValue(e.target.value);
  };

  const filterDoctors = () => {
    const filtered = doctors.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()));
    setDoctors(filtered);
  };

  const handleClear = () => {
    setDoctor(model);
    setUpdatingData(false);
    setHealthSelected([]);
    setSpecialtySelected([]);
    setTemporaryAbsence(tempAbsence);
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
              <Card.Title as="h5">Médicos</Card.Title>
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
                        <Row></Row>
                        <Row>
                          <Col lg={1}>
                            <Form.Group controlId="numberTypeDoc">
                              <Form.Label>CRM{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <InputMask
                                className="form-control"
                                name="numberTypeDoc"
                                type="text"
                                required={!updatingData}
                                disabled={updatingData}
                                value={doctor.numberTypeDoc}
                                /* onBlur={searchExistingDoctor} */
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
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
                                value={doctor.document}
                                /* onBlur={searchExistingDoctor} */
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={5}>
                            <Form.Group controlId="doctor">
                              <Form.Label>Médico{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="name"
                                type="text"
                                required={!updatingData}
                                placeholder="Digite aqui o nome do Médico."
                                value={doctor.name}
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
                                value={doctor.dateBirth}
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
                                value={doctor.phone}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="timeSendConfirmation">
                              <Form.Label>Confirmação{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="timeSendConfirmation"
                                type="text"
                                required={!updatingData}
                                placeholder="Minutos"
                                value={doctor.timeSendConfirmation}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={2}>
                            <Form.Group controlId="timePerQuery">
                              <Form.Label>Consulta{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Form.Control
                                name="timePerQuery"
                                type="text"
                                required={!updatingData}
                                placeholder="Minutos"
                                value={doctor.timePerQuery}
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
                                required={!updatingData}
                                options={healthInsurances}
                                value={healthSelected}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Selecione"
                                onChange={handleInsuranceChange}
                                isSearchable
                              />
                            </Form.Group>
                          </Col>

                          <Col lg={3}>
                            <Form.Group controlId="specialties">
                              <Form.Label>Especialidades{updatingData ? '' : <span className="mandatory">*</span>}</Form.Label>

                              <Select
                                isMulti
                                name="specialties"
                                required={!updatingData}
                                options={specialties}
                                value={specialtySelected}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Selecione"
                                onChange={handleSpecialtyChange}
                                isSearchable
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col className="p-4" lg={12}>
                            Configure os horários de acordo com a disponibilidade do profissional:
                          </Col>
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className="p-label-days">
                            <Form.Group controlId="status_seg">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="status_seg"
                                  checked={Boolean(workDays.seg.status)}
                                  value={Boolean(workDays.seg.status)}
                                  onChange={(e) => changeWorkDay(e, 'seg')}
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Segunda</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.seg.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.seg.status)}
                                disabled={!Boolean(workDays.seg.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.seg.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'seg')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.seg.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.seg.status)}
                                disabled={!Boolean(workDays.seg.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.seg.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'seg')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.seg.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.seg.status)}
                                disabled={!Boolean(workDays.seg.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.seg.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'seg')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.seg.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.seg.status)}
                                disabled={!Boolean(workDays.seg.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.seg.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'seg')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="ter_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="ter_active"
                                  checked={Boolean(workDays.ter.status)}
                                  value={Boolean(workDays.ter.status)}
                                  onChange={(e) => changeWorkDay(e, 'ter')}
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Terça</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.ter.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.ter.status)}
                                disabled={!Boolean(workDays.ter.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.ter.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'ter')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.ter.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.ter.status)}
                                disabled={!Boolean(workDays.ter.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.ter.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'ter')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.ter.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.ter.status)}
                                disabled={!Boolean(workDays.ter.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.ter.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'ter')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.ter.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.ter.status)}
                                disabled={!Boolean(workDays.ter.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.ter.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'ter')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="quar_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="quar_active"
                                  checked={Boolean(workDays.quar.status)}
                                  value={Boolean(workDays.quar.status)}
                                  onChange={(e) => changeWorkDay(e, 'quar')}
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Quarta</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quar.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.quar.status)}
                                disabled={!Boolean(workDays.quar.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.quar.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'quar')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quar.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.quar.status)}
                                disabled={!Boolean(workDays.quar.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.quar.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'quar')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quar.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.quar.status)}
                                disabled={!Boolean(workDays.quar.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.quar.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'quar')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quar.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.quar.status)}
                                disabled={!Boolean(workDays.quar.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.quar.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'quar')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="quin_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="quin_active"
                                  checked={Boolean(workDays.quin.status)}
                                  value={Boolean(workDays.quin.status)}
                                  onChange={(e) =>
                                    setWorkDays((prevWorkDays) => ({
                                      ...prevWorkDays,
                                      quin: {
                                        ...prevWorkDays['quin'],
                                        status: !workDays.quin.status
                                      }
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Quinta</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quin.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.quin.status)}
                                disabled={!Boolean(workDays.quin.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.quin.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'quin')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quin.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.quin.status)}
                                disabled={!Boolean(workDays.quin.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.quin.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'quin')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quin.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.quin.status)}
                                disabled={!Boolean(workDays.quin.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.quin.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'quin')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.quin.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.quin.status)}
                                disabled={!Boolean(workDays.quin.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.quin.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'quin')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="sex_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="sex_active"
                                  checked={Boolean(workDays.sex.status)}
                                  value={Boolean(workDays.sex.status)}
                                  onChange={(e) =>
                                    setWorkDays((prevWorkDays) => ({
                                      ...prevWorkDays,
                                      sex: {
                                        ...prevWorkDays['sex'],
                                        status: !workDays.sex.status
                                      }
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Sexta</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sex.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.sex.status)}
                                disabled={!Boolean(workDays.sex.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.sex.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'sex')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sex.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.sex.status)}
                                disabled={!Boolean(workDays.sex.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.sex.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'sex')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sex.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.sex.status)}
                                disabled={!Boolean(workDays.sex.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.sex.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'sex')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sex.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.sex.status)}
                                disabled={!Boolean(workDays.sex.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.sex.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'sex')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="sab_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="sab_active"
                                  checked={Boolean(workDays.sab.status)}
                                  value={Boolean(workDays.sab.status)}
                                  onChange={(e) =>
                                    setWorkDays((prevWorkDays) => ({
                                      ...prevWorkDays,
                                      sab: {
                                        ...prevWorkDays['sab'],
                                        status: !workDays.sab.status
                                      }
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Sábado</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sab.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.sab.status)}
                                disabled={!Boolean(workDays.sab.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.sab.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'sab')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sab.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.sab.status)}
                                disabled={!Boolean(workDays.sab.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.sab.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'sab')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sab.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.sab.status)}
                                disabled={!Boolean(workDays.sab.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.sab.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'sab')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.sab.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.sab.status)}
                                disabled={!Boolean(workDays.sab.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.sab.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'sab')}
                              />
                            </Form.Group>
                          </Col>
                          <hr />
                        </Row>
                        <Row>
                          <Col lg={1}></Col>
                          <Col lg={2} className=" p-label-days">
                            <Form.Group controlId="dom_active">
                              <div className="checkbox d-inline checkbox-fill">
                                <Form.Control
                                  type="checkbox"
                                  name="dom_active"
                                  checked={Boolean(workDays.dom.status)}
                                  value={Boolean(workDays.dom.status)}
                                  onChange={(e) =>
                                    setWorkDays((prevWorkDays) => ({
                                      ...prevWorkDays,
                                      dom: {
                                        ...prevWorkDays['dom'],
                                        status: !workDays.dom.status
                                      }
                                    }))
                                  }
                                />
                                <Form.Label className="cr">
                                  <span className="ml-2">Domingo</span>
                                </Form.Label>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.dom.initMorning">
                              <Form.Label>Horário Inicial (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initMorning"
                                type="text"
                                required={!Boolean(workDays.dom.status)}
                                disabled={!Boolean(workDays.dom.status)}
                                placeholder="09:00:00"
                                mask="99:99:99"
                                value={workDays.dom.initMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'dom')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.dom.finalMorning">
                              <Form.Label>Horário Final (Manhã)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalMorning"
                                type="text"
                                required={!Boolean(workDays.dom.status)}
                                disabled={!Boolean(workDays.dom.status)}
                                placeholder="12:00:00"
                                mask="99:99:99"
                                value={workDays.dom.finalMorning}
                                onChange={(e) => handleChangeWorkDays(e, 'dom')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.dom.initAfternoon">
                              <Form.Label>Horário Inicial (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="initAfternoon"
                                type="text"
                                required={!Boolean(workDays.dom.status)}
                                disabled={!Boolean(workDays.dom.status)}
                                placeholder="13:00:00"
                                mask="99:99:99"
                                value={workDays.dom.initAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'dom')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={2}>
                            <Form.Group controlId="workDays.dom.finalAfternoon">
                              <Form.Label>Horário Final (Tarde)</Form.Label>

                              <InputMask
                                className="form-control"
                                name="finalAfternoon"
                                type="text"
                                required={!Boolean(workDays.dom.status)}
                                disabled={!Boolean(workDays.dom.status)}
                                placeholder="18:00:00"
                                mask="99:99:99"
                                value={workDays.dom.finalAfternoon}
                                onChange={(e) => handleChangeWorkDays(e, 'dom')}
                              />
                            </Form.Group>
                          </Col>
                          <Col lg={12} className="">
                            {updatingData ? (
                              <small>
                                Criado por {doctor.createdBy} em {doctor.createdAt}. Atualizado pela última vez em {doctor.updatedAt} por{' '}
                                {doctor.lastChangedBy}.{' '}
                              </small>
                            ) : (
                              ''
                            )}
                          </Col>
                          <hr />
                        </Row>
                        <hr />

                        <Row>
                          <Col lg={12}>
                            <div className="float-left">
                              {updatingData ? (
                                <Button variant="warning" onClick={openTemporary}>
                                  Ausência Temporária
                                </Button>
                              ) : (
                                ''
                              )}
                            </div>
                            <div className="float-right">
                              {updatingData ? (
                                <Button variant="info" onClick={handleUpdate}>
                                  Salvar Alterações
                                </Button>
                              ) : (
                                <Button variant="primary" onClick={handleSubmit}>
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
              <Card.Title as="h5">Nossos Médicos</Card.Title>
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
                      onBlur={filterDoctors}
                      onKeyDown={function (e) {
                        if (e.key === 'Enter') {
                          filterDoctors();
                        }
                      }}
                      value={searchValue}
                    />
                  </Form.Group>
                </Col>
              </Row>
              {doctors && doctors.length > 0 ? (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>CPF</th>
                      <th>Nome</th>
                      <th>Data de Nascimento</th>
                      <th>Telefone</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((item) => (
                      <tr key={item.doctorId}>
                        <td>{item.doctorId}</td>
                        <td>
                          {item.document.toString().substr(0, 3)}.{item.document.toString().substr(3, 3)}.
                          {item.document.toString().substr(6, 3)}-{item.document.toString().substr(9)}
                        </td>
                        <td>{item.name}</td>
                        <td>{item.dateBirth}</td>
                        <td>
                          {' '}
                          ({item.phone.toString().substr(0, 2)}) {item.phone.toString().substr(2, 5)}-{item.phone.toString().substr(7)}
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
                            <i className="feather icon-edit-2" /> Editar / Ficha Completa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <center>
                  <span>Nenhum médico encontrado.</span>
                </center>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Modal centered size="xl" show={openModalTemporary} onHide={() => setOpenModalTemporary(false)}>
          <Modal.Header closeButton>
            <Modal.Title as="h5">Ausência Temporária</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h6>Cadastrar Ausência Temporária</h6>
            <Row>
              <Col lg={3}>
                <Form.Group controlId="statusSelection">
                  <Form.Label>Motivo</Form.Label>
                  <Select
                    name="reason"
                    options={reasonTemporaryAbsences}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Selecione"
                    value={reasonSelectedOption}
                    onChange={handleReasonChange}
                    isSearchable
                  />
                </Form.Group>
              </Col>
              <Col lg={2}>
                <Form.Group controlId="date">
                  <Form.Label>Data Inicial</Form.Label>

                  <DatePicker
                    name="data"
                    locale="pt-BR"
                    dateFormat="dd/MM/yyyy"
                    selected={initDate}
                    minDate={new Date()}
                    onChange={handleDateSelectChange}
                    className="form-control"
                  />
                </Form.Group>
              </Col>
              <Col lg={2}>
                <Form.Group controlId="time">
                  <Form.Label>Hora Inicial</Form.Label>

                  <InputMask
                    className="form-control"
                    name="initTime"
                    type="text"
                    placeholder="09:00:00"
                    mask="99:99:99"
                    value={temporaryAbsence.initTime}
                    onChange={handleChangeTA}
                  />
                </Form.Group>
              </Col>

              <Col lg={2}>
                <Form.Group controlId="date">
                  <Form.Label>Data Final</Form.Label>

                  <DatePicker
                    name="data"
                    locale="pt-BR"
                    dateFormat="dd/MM/yyyy"
                    selected={endDate}
                    minDate={new Date()}
                    onChange={handleEndDateSelectChange}
                    className="form-control"
                  />
                </Form.Group>
              </Col>

              <Col lg={2}>
                <Form.Group controlId="time">
                  <Form.Label>Hora Final</Form.Label>

                  <InputMask
                    className="form-control"
                    name="endTime"
                    type="text"
                    placeholder="09:00:00"
                    mask="99:99:99"
                    value={temporaryAbsence.endTime}
                    onChange={handleChangeTA}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={11}>
                <Form.Group controlId="patient">
                  <Form.Label>Observações</Form.Label>

                  <Form.Control
                    name="observation"
                    type="text"
                    placeholder="Digite aqui a observação."
                    value={temporaryAbsence.observation}
                    onChange={handleChangeTA}
                  />
                </Form.Group>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col lg={12}>
                <div className="float-right">
                  <Button variant="primary" onClick={handleSaveTA}>
                    Cadastrar
                  </Button>
                  <Button variant="secundary" onClick={handleClear}>
                    Limpar
                  </Button>
                </div>
              </Col>
            </Row>
            <h6>Histórico</h6>
            {temporaryAbsences && temporaryAbsences.length > 0 ? (
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>Médico</th>
                    <th>Data Início</th>
                    <th>Data Término</th>
                    <th>Motivo</th>
                    <th>Observações</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {temporaryAbsences.map((item) => (
                    <tr key={item.temporaryAbsenceId}>
                      <td>{item.doctorName}</td>
                      <td>
                        {item.initDate} ({item.initTime})
                      </td>
                      <td>
                        {item.endDate} ({item.endTime})
                      </td>
                      <td>{item.reasonTemporaryAbsenceId}</td>
                      <td>{item.observation}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          className="float-right mr-md"
                          onClick={() => {
                            deleteTA(item.temporaryAbsenceId);
                          }}
                        >
                          <i className="feather icon-trash" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <center>
                <span>Não temos ausência para este médico.</span>
              </center>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setOpenModalTemporary(false)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      </Row>
    </React.Fragment>
  );
}

export default Doctors;
