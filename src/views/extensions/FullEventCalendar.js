import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Button, Modal, Form, Table, Card, Badge } from 'react-bootstrap';
import InputMask from 'react-input-mask';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interaction from '@fullcalendar/interaction';
import timeGrid from '@fullcalendar/timegrid';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import allLocales from '@fullcalendar/core/locales-all';
import { ENDPOINT } from '../../config/constant';
import withReactContent from 'sweetalert2-react-content';
import { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import CardMain from '../../components/Card/MainCard';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import Swal from 'sweetalert2';
import axios from 'axios';
import isValidCPF from '../../services/cpfvalidator';
import { LoadingContext } from '../../contexts/LoadingContext';
import Loader from '../../components/Loader/Loader';

const FullEventCalendar = () => {
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [statusSelectedOption, setStatusSelectedOption] = useState([]);
  const [statusSelection, setStatusSelection] = useState([]);
  const [calendarDate, setCalendarDate] = useState('');
  const [scheduleTypes, setScheduleTypes] = useState('');
  const { loading } = useContext(LoadingContext);
  registerLocale('pt-BR', ptBR);
  const modelPatient = {
    patientId: '',
    name: '',
    document: '',
    phone: '',
    acceptedMessage: true
  };
  const model = {
    data: '',
    time: '',
    hasHealthInsurance: false,
    hasFirstQuery: true,
    statusId: 2,
    patientId: '',
    doctorId: '',
    scheduleTypeId: 1,
    obs: '',
    healthInsuranceId: ''
  };
  const [isOpen, setIsOpen] = useState(true);
  const [updatingData, setUpdatingData] = useState(false);
  const [newFormSchedule, setNewFormSchedule] = useState(model);
  const [scheds, setScheds] = useState([]);
  const [schedsToday, setSchedsToday] = useState([]);
  const [patients, setPatients] = useState([]);
  const [existingPatients, setExistingPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorsFilter, setDoctorsFilter] = useState([]);
  const [statusFormSelection, setStatusFormSelection] = useState([]);
  const [doctorSelectedOption, setDoctorSelectedOption] = useState([]);
  const [patientSelectedOption, setPatientSelectedOption] = useState([]);
  const [healthInsuranceSelectedOption, setHealthInsuranceSelectedOption] = useState([]);
  const [typeSelectedOption, setTypeSelectedOption] = useState(1);
  const [statusSelectedFormOption, setStatusSelectedFormOption] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isRegisterPatient, setIsRegisterPatient] = useState(false);
  const [patient, setPatient] = useState(modelPatient);
  const [exist, setExist] = useState(false);
  const [healthInsurances, setHealthInsurances] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    getStatus();
    getPatients();
    getDoctors();
    getScheduleTypes();
    getHealthInsurances();
    getDoctorsFilter();
    getDoctorSchedules(`schedules/only`);
    getSchedules();
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

  const add15MinutesToTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);

    const totalMinutes = hours * 60 + minutes + 15;

    const updatedHours = Math.floor(totalMinutes / 60) % 24;
    const updatedMinutes = totalMinutes % 60;
    const updatedSeconds = seconds;

    const formattedTime = `${String(updatedHours).padStart(2, '0')}:${String(updatedMinutes).padStart(2, '0')}:${String(
      updatedSeconds
    ).padStart(2, '0')}`;

    return formattedTime;
  };

  const add8MinutesToTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);

    const totalMinutes = hours * 60 + minutes + 1080;

    const updatedHours = Math.floor(totalMinutes / 60) % 24;
    const updatedMinutes = totalMinutes % 60;
    const updatedSeconds = seconds;

    const formattedTime = `${String(updatedHours).padStart(2, '0')}:${String(updatedMinutes).padStart(2, '0')}:${String(
      updatedSeconds
    ).padStart(2, '0')}`;

    return formattedTime;
  };

  const setColour = (id) => {
    switch (id) {
      case 1:
        return '#A9A9A9';
      case 2:
        return '#d7b602';
      case 3:
        return '#CD0000';
      case 4:
        return '#228B22';
      case 5:
        return '#CDB5CD';
      case 6:
        return '#FF7F50';
      case 7:
        return '#7AC5CD';
      default:
        return '#CD9B9B';
    }
  };

  const setStatusIcon = (id) => {
    switch (id) {
      case 1:
        return `Finalizado`;
      case 2:
        return `Pendente`;
      case 3:
        return `Cancelado`;
      case 4:
        return `Confirmado`;
      case 5:
        return `Erro confirmação automática`;
      case 6:
        return `Enviado mensagem de confirmação`;
      case 7:
        return `Necessário confirmação manual`;
      default:
        return `Erro`;
    }
  };

  const whichDoctor = async (type, id) => {
    if (type === '1') {
      setDoctorSelectedOption(null);
      const foundObject = doctors.find((item) => item.label === window.localStorage.getItem('name'));
      if (foundObject) {
        getDoctorSchedules(`schedules/only?doctorId=${foundObject.value}`);
      } else {
        sweetAlertHandler({ title: 'Poxa...', text: 'Sem agendamentos para este usuário.', icon: 'warning', showCloseButton: true });
      }
    } else if (type === '2') {
      setDoctorSelectedOption(null);
      getDoctorSchedules(`schedules/only`);
    } else {
      getDoctorSchedules(`schedules/only?doctorId=${id}`);
    }
  };

  const handleDoctorschedSelectChange = async (selected) => {
    setDoctorSelectedOption(selected);
    whichDoctor('3', selected.value);
  };

  const assembleFullSchedule = (originalData) => {
    const newData = [];
    originalData.forEach((doctor) => {
      doctor.schedules.forEach((schedule) => {
        const [day, month, year] = schedule.data.split('/');
        const formattedDate = `${year}-${month}-${day}`;
        const combinedStart = `${formattedDate} ${schedule.time}`;
        const combinedEnd = `${formattedDate} ${add15MinutesToTime(schedule.time)}`;
        newData.push({
          id: schedule.scheduleId,
          title: `${schedule.type == 'Exame' ? '📁' : ''} (${doctor.name}) ${schedule.patientName} | ${setStatusIcon(schedule.statusId)} ${
            schedule.healthInsurance !== null ? `{${schedule.healthInsurance.name}}` : ''
          }`,
          description: 'io',
          start: combinedStart,
          end: combinedEnd,
          borderColor: setColour(schedule.statusId),
          backgroundColor: setColour(schedule.statusId),
          eventTextColor: '#fff',
          extendedProps: {
            data: schedule.data,
            hasFirstQuery: schedule.hasFirstQuery,
            obs: schedule.obs == null ? '' : schedule.obs,
            patientId: schedule.patientId,
            type: schedule.type,
            patientName: schedule.patientName,
            scheduleId: schedule.scheduleId,
            status: schedule.status,
            statusId: schedule.statusId,
            time: schedule.time,
            doctor: doctor.name,
            healthInsurance: schedule.healthInsurance !== null ? schedule.healthInsurance.name : null
          }
        });
      });

      doctor.temporaryAbsence.forEach((temporaryabs) => {
        if (temporaryabs.temporary) {

          const [dayA, monthA, yearA] = temporaryabs.data.split('/')
          // const [dayE, monthE, yearE] = temporaryabs.temporary.endDate.split('/');

          const combinedStart = `${yearA}-${monthA}-${dayA}T${temporaryabs.temporary.initTime}`;
          const combinedEnd = `${yearA}-${monthA}-${dayA}T${temporaryabs.temporary.endTime}`;
          
          newData.push({
            id: temporaryabs.temporary.scheduleId,
            title: `AUSENTE: (${doctor.name}) - ${temporaryabs.temporary.reasonTemporaryAbsence.description}`,
            description: 'io',
            start: combinedStart,
            end: combinedEnd,
            borderColor: '#9C9C9C',
            backgroundColor: '#9C9C9C',
            eventTextColor: '#CD9B9B'
          });
        }
      });
    });

    /* originalData.forEach((doctor) => {
      
    }); */

    return newData;
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

  const getDoctorSchedules = async (fullendpoint) => {
    await axios
      .get(`${ENDPOINT.api}${fullendpoint}`, ENDPOINT.config)
      .then((response) => {
        setDoctorSchedules(assembleFullSchedule(response.data.response));
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

  const handleStatusSelectChange = async (selected) => {
    setStatusSelectedOption(selected);
    setModalData((prevData) => ({
      ...prevData,
      statusId: selected.value
    }));
  };

  const selectedSchedule = async (args) => {
    setStatusSelectedOption(statusSelection.find((option) => option.value === args.event.extendedProps.statusId));
    setModalData(args.event.extendedProps);
    setIsModalOpen(true);
  };

  const submitUpdate = async (updateId, updatedData) => {
    const updateForm = { statusId: updatedData.statusId, obs: updatedData.obs };
    await axios
      .patch(`${ENDPOINT.api}schedules/${updateId}`, updateForm, ENDPOINT.config)
      .then((response) => {
        if (response.data.statusCode === 200) {
          setIsModalOpen(false);
          setModalData([]);
          getSchedules();
          getDoctorSchedules(`schedules/only`);
          
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
    // if (updatedData.obs !== '') {
    //   console.log('HELLO')
    //   await axios
    //     .post(`${ENDPOINT.api}queries`, { scheduleId: updateId, obs: updatedData.obs }, ENDPOINT.config)
    //     .then((response) => {
    //       if (response.data.statusCode === 200) {
    //         sweetAlertHandler({
    //           title: 'Tudo certo!',
    //           text: 'Consulta alterada com sucesso.',
    //           icon: 'success',
    //           showCloseButton: true

    //         })
    //         setIsModalOpen(false);
    //         setModalData([]);
    //         getSchedules();
    //         getDoctorSchedules(`schedules/only`);
    //       } else {
    //         if (response.data.statusCode === 400) {
    //           sweetAlertHandler({ title: 'Poxa...', text: response.data.response, icon: 'error', showCloseButton: true });
    //         } else {
    //           sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
    //         }
    //       }
    //     })
    //     .catch((err) => {
    //       sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
    //       console.error('Não foi possível alterar a Consulta.' + err);
    //     });
    // }
  };

  const newSchedule = (args) => {
    getPatients();
    setCalendarDate(args.dateStr);

    if (args.dateStr.length > 11) {
      const [date] = args.dateStr.split('T');
      const [year, month, day] = date.split('-');
      const dateInstance = new Date(year, month - 1, day);
      setScheduleDate(dateInstance);
      const timePart = args.dateStr.split('T')[1].split('-')[0];
      setNewFormSchedule((prevData) => ({
        ...prevData,
        time: timePart
      }));
    } else {
      const [year, month, day] = args.dateStr.split('-');
      const dateInstance = new Date(year, month - 1, day);
      setScheduleDate(dateInstance);
      setNewFormSchedule((prevData) => ({
        ...prevData,
        time: ''
      }));
    }

    setIsScheduleOpen(true);
  };

  const handleChange = (e) => {
    setModalData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const head = {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek,dayGridMonth'
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
    const parts = inputDate.split('-'); // Split the input date string into parts
    const year = parts[2];
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);

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
        const newdata = await transformData(response.data.response);
        const orderednd = newdata.sort((a, b) => b.scheduleId - a.scheduleId);

        setScheds(orderednd);
        await getTodaySchedules(orderednd);
      })
      .catch((err) => {
        console.error('Não foi possível puxar as consultas.' + err);
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

        setExistingPatients(response.data.response);
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Pacientes.' + err);
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

  const getDoctors = async () => {
    await axios
      .get(`${ENDPOINT.api}doctors`, ENDPOINT.config)
      .then(async (response) => {
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

  // const getFormStatus = async () => {
  //   await axios
  //     .get(`${ENDPOINT.api}status`, ENDPOINT.config)
  //     .then(async (response) => {
  //       await setStatusFormSelection(
  //         response.data.response.map((item) => ({
  //           value: item.statusId,
  //           label: item.description
  //         }))
  //       );
  //     })
  //     .catch((err) => {
  //       console.error('Não foi possível puxar os Status.' + err);
  //     });
  // };

  const getDoctorsFilter = () => {
    setDoctorsFilter(doctors);

    /* setDoctorsFilter((prevData) => ({
      ...prevData,
      a: { value: 0, label: 'Todos' }
    })); */
  };

  const transformData = async (data) => {
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
              descriptionStatus,
              hasFirstQuery,
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
              statusName: descriptionStatus,
              type,
              hasFirstQuery: hasFirstQuery
            });
          })
        );
      })
    );

    return transformedData;
  };

  const handleTypeSelectChange = async (selected) => {
    setTypeSelectedOption(selected);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      scheduleTypeId: selected.value
    }));
  };

  const handlePatientSelectChange = async (selected) => {
    setPatientSelectedOption(selected);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      patientId: selected.value
    }));
  };

  const handleHealthInsuranceSelectChange = async (selected) => {
    setHealthInsuranceSelectedOption(selected);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      healthInsuranceId: selected.value
    }));
  };

  const handleDoctorSelectChange = async (selected) => {
    setDoctorSelectedOption(selected);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      doctorId: selected.value
    }));
  };

  const handleStatusFormSelectChange = async (selected) => {
    setStatusSelectedFormOption(selected);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      statusId: selected.value
    }));
  };

  const handleDateSelectChange = (date) => {
    setScheduleDate(date);
    setNewFormSchedule((prevData) => ({
      ...prevData,
      data: `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
    }));
  };

  const handleFormChange = (e) => {
    setNewFormSchedule((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    setIsDisabled(true);
    e.preventDefault();
    await axios
      .post(
        `${ENDPOINT.api}schedules`,
        {
          data: scheduleDate,
          time: newFormSchedule.time,
          hasHealthInsurance: newFormSchedule.healthInsuranceId !== '' &&  newFormSchedule.healthInsuranceId !== null ? true : false,
          hasFirstQuery: newFormSchedule.hasFirstQuery,
          statusId: 2,
          obs: newFormSchedule.obs,
          patientId: parseInt(newFormSchedule.patientId, 10),
          doctorId: parseInt(newFormSchedule.doctorId !== '' ? newFormSchedule.doctorId : doctorSelectedOption.value, 10),
          scheduleTypeId: newFormSchedule.scheduleTypeId,
          healthInsuranceId: newFormSchedule.healthInsuranceId !== '' &&  newFormSchedule.healthInsuranceId !== null ? newFormSchedule.healthInsuranceId : null
        },
        ENDPOINT.config
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          handleClear()
          sweetAlertHandler({
            title: 'Tudo certo!',
            text: 'Consulta cadastrada com sucesso.',
            icon: 'success',
            showCloseButton: true,

          });
          setIsScheduleOpen(false);
          getSchedules();
          getDoctorSchedules(`schedules/only`);
        } else {
          if (response.data.statusCode === 400) {
            sweetAlertHandler({ title: 'Poxa...', text: response.data.response, icon: 'error', showCloseButton: true });
          } else {
            sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel alterar.', icon: 'error', showCloseButton: true });
          }
        }
        setIsDisabled(false);
      })
      .catch((err) => {
        sweetAlertHandler({ title: 'Poxa...', text: 'Não foi possivel cadastrar.', icon: 'error', showCloseButton: true });
        console.error('Não foi possível cadastrar o Consulta.' + err);
        setIsDisabled(false);
      });
  };

  const submitEdit = (editItem) => {
    setIsOpen(true);
    setUpdatingData(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setDoctorSelectedOption(doctors.find((option) => option.value === editItem.doctorId));
    setPatientSelectedOption(patients.find((option) => option.value === editItem.patientId));
    setHealthInsuranceSelectedOption(healthInsurances.find((option) => option.value === editItem.healthInsuranceId));
    setStatusSelectedFormOption(statusFormSelection.find((option) => option.value === editItem.statusId));

    const [date] = editItem.data.split('T');
    const [year, month, day] = date.split('-');
    const dateInstance = new Date(year, month - 1, day);
    setScheduleDate(dateInstance);

    setNewFormSchedule({
      data: dateInstance,
      time: editItem.time,
      hasHealthInsurance: false,
      hasFirstQuery: editItem.hasFirstQuery,
      statusId: editItem.statusId,
      patientId: editItem.patientId,
      doctorId: editItem.doctorId,
      scheduleId: editItem.scheduleId,
      healthInsuranceId: editItem.healthInsuranceId,
      scheduleTypeId: editItem.scheduleTypeId
    });
  };

  const handleUpdate = async (e) => {
    const filteredData = scheds.filter((item) => item.scheduleId === newFormSchedule.scheduleId);

    const updatedData = {};

    for (const key in newFormSchedule) {
      if (newFormSchedule[key] !== filteredData[0][key]) {
        if (key === 'data') {
          if (newFormSchedule[key] instanceof Date) {
            updatedData[key] = `${newFormSchedule[key].getFullYear()}-${newFormSchedule[key].getMonth() + 1}-${newFormSchedule[
              key
            ].getDate()}`;
          } else {
            formatDate(newFormSchedule[key]);
          }
        } else {
          updatedData[key] = newFormSchedule[key];
        }
      }
    }

    if (Object.keys(updatedData).length > 0) submitFormUpdate(newFormSchedule.scheduleId, updatedData);
  };

  const submitFormUpdate = async (updateId, updatedData) => {
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
          handleClear()
          setUpdatingData(false);
          setIsOpen(false);
          getSchedules();
          getDoctorSchedules(`schedules/only`);
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

  const filterSchedsToday = () => {
    const filtered = schedsToday.filter((item) => item.patientName.toLowerCase().includes(searchValue.toLowerCase()));
    setSchedsToday(filtered);
  };

  const handleSearch = (e) => {
    if (e.target.value == '') {
      getSchedules();
    }
    setSearchValue(e.target.value);
  };

  const handlePatientChange = (e) => {
    setPatient((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
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
          getPatients();
          handlePatientSelectChange({ value: response.data.response.patientId, label: response.data.response.name });
          setIsRegisterPatient(false);
          setPatient(modelPatient);
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

  const handleClear = () => {
    setNewFormSchedule(model);
    setTypeSelectedOption('');
    setPatientSelectedOption('');
    setDoctorSelectedOption('');
    setScheduleDate('');
    setHealthInsuranceSelectedOption('');
    
    // setSchedsToday([]);
  };

  return (
    <React.Fragment>
      {loading && (
        <div>
          <Loader />
        </div>
      )}
      <Row>
        <Col sm={12}></Col>
      </Row>
      <Row>
        <Col>
          <CardMain title="Agendas" isOption>
            <Row>
              <Col sm={{ span: 7, offset: 5 }}>
                <Col sm={4}>
                  <center>
                    <Button size="sm" variant="secondary" onClick={() => whichDoctor('1', '')}>
                      Minha Agenda
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => whichDoctor('2', '')}>
                      Todas{' '}
                    </Button>
                  </center>
                </Col>
                <Col sm={4}>
                  <Form.Group controlId="doctorId">
                    <Select
                      name="doctorId"
                      options={doctors}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      placeholder="Selecione"
                      value={doctorSelectedOption}
                      onChange={handleDoctorschedSelectChange}
                      isSearchable
                    />
                  </Form.Group>
                </Col>
              </Col>
            </Row>
            <hr />
            <FullCalendar
              defaultView="timeGridDay"
              initialView="timeGridDay"
              locales={allLocales}
              slotDuration={'00:15:00'}
              slotLabelInterval={'00:15:00'}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: false,
                meridiem: 'short'
              }}
              locale={'pt-br'}
              headerToolbar={head}
              allDaySlot={false}
              nowIndicator={true}
              events={doctorSchedules}
              plugins={[dayGridPlugin, interaction, timeGrid, bootstrapPlugin]}
              themeSystem={'bootstrap'}
              eventClick={function (args) {
                selectedSchedule(args);
              }}
              dateClick={function (args) {
                newSchedule(args);
              }}
            />

            <Col sm={12}>
              <Col sm={12} className="mt-3">
                <center>
                  {statusSelection.map((item) => (
                    <Badge
                      pill
                      style={{ backgroundColor: setColour(item.value), borderColor: setColour(item.value), color: 'white' }}
                      className="ml-1 p-2"
                    >
                      {item.label}{' '}
                    </Badge>
                  ))}
                </center>
              </Col>
            </Col>

            <Modal centered size="xl" show={isModalOpen} onHide={() => setIsModalOpen(false)}>
              <Modal.Header closeButton>
                <Modal.Title as="h5">Ficha da Consulta ( {modalData.scheduleId} )</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row className="m-t-15">
                  <Col lg={4} className="m-t-15">
                    <h6>Dados da Consulta</h6>
                    <hr />
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Data</span>
                      <br />
                      {modalData.data}
                    </Col>
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Hora</span>
                      <br />
                      {modalData.time}
                    </Col>
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Médico</span>
                      <br />
                      {modalData.doctor}
                    </Col>
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Paciente</span>
                      <br />
                      {modalData.patientName}
                    </Col>
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Retorno?</span>
                      <br />
                      {!modalData.hasFirstQuery ? 'Sim' : 'Não'}
                    </Col>{' '}
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Observações</span>
                      <br />
                      {modalData.obs}
                    </Col>
                    <Col lg={6} className="p-2">
                      <span className="modal-title">Plano de Saúde</span>
                      <br />
                      {modalData.healthInsurance ?? ' - '}
                    </Col>
                  </Col>

                  <Col lg={7} className="m-t-15">
                    <h6>Observações da Consulta</h6>
                    <hr />
                    <Col lg={12}>
                      <Form.Group controlId="patient">
                        <Form.Label>Observação</Form.Label>

                        <Form.Control
                          name="obs"
                          as="textarea"
                          rows="12"
                          value={modalData.obs}
                          onChange={handleChange}
                          placeholder="Digite aqui as observações da consulta."
                        />
                      </Form.Group>
                    </Col>

                    <Col lg={12}>
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
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  disabled={isDisabled}
                  onClick={() => submitUpdate(modalData.scheduleId, { obs: modalData.obs, statusId: modalData.statusId })}
                >
                  {isDisabled ? 'Salvando...' : 'Salvar Alterações'} 
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal centered size="xl" show={isScheduleOpen} onHide={() => setIsScheduleOpen(false)}>
              <Modal.Header closeButton>
                <Modal.Title as="h5">Nova Consulta</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Col md={12}>
                    <Form onSubmit={handleSubmit}>
                      <Row>
                        <Col lg={12}></Col>
                      </Row>
                      <Row>
                        <Col lg={12}>
                          <Form.Group controlId="hasFirstQuery">
                            <Form.Label className="m-b-15">
                              Retorno?<span className="mandatory">*</span>
                            </Form.Label>
                            <br />
                            <div className="checkbox d-inline checkbox-fill">
                              <Form.Control
                                type="checkbox"
                                name="hasFirstQuery"
                                checked={Boolean(newFormSchedule.hasFirstQuery)}
                                value={newFormSchedule.hasFirstQuery}
                                onChange={(e) =>
                                  setNewFormSchedule((prevData) => ({
                                    ...prevData,
                                    hasFirstQuery: !newFormSchedule.hasFirstQuery
                                  }))
                                }
                              />
                              <Form.Label className="cr">
                                <span className="ml-2">{newFormSchedule.hasFirstQuery ? 'Sim' : 'Não'}</span>
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
                            {!isRegisterPatient ? <i className="feather icon-plus-circle" /> : <i className="feather icon-minus-circle" />}
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
                              value={newFormSchedule.time}
                              onChange={handleFormChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={6}>
                          <Form.Group controlId="time">
                            <Form.Label>Observações</Form.Label>

                            <InputMask
                              className="form-control"
                              name="obs"
                              type="text"
                              placeholder="Observações"
                              value={newFormSchedule.obs}
                              onChange={handleFormChange}
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
                            <Form.Group controlId="statusFormSelection">
                              <Form.Label>Situação</Form.Label>

                              <Select
                                name="status"
                                options={statusFormSelection}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Selecione"
                                value={statusSelectedFormOption}
                                onChange={handleStatusFormSelectChange}
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
                      {!isRegisterPatient ? (
                        <Row className="mt-3">
                          <Col lg={12}>
                            <div className="float-right">
                              {updatingData ? (
                                <Button variant="info" onClick={handleUpdate}>
                                  Salvar Alterações
                                </Button>
                              ) : (
                                <Button variant="primary" type="submit" disabled={isDisabled}>
                                   {!isDisabled ? 'Cadastrar'  : 'Salvando...' } 
                                </Button>
                              )}
                              <Button variant="secundary" onClick={handleClear}>
                                Limpar
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        ''
                      )}
                    </Form>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => { setIsScheduleOpen(false); handleClear()}}>
                  Fechar
                </Button>
              </Modal.Footer>
            </Modal>
          </CardMain>
        </Col>
      </Row>
      <Row>
        <Col sm={12}></Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Nossas Consultas de Hoje</Card.Title>
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
    </React.Fragment>
  );
};

export default FullEventCalendar;
