import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interaction from '@fullcalendar/interaction';
import timeGrid from '@fullcalendar/timegrid';
import allLocales from '@fullcalendar/core/locales-all';
import { ENDPOINT } from '../../config/constant';

import axios from 'axios';

const Agenda = () => {
  const [doctorSchedules, setDoctorSchedules] = useState([]);

  const add15MinutesToTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);

    // Convert everything to minutes and add 15 minutes
    const totalMinutes = hours * 60 + minutes + 15;

    // Calculate the updated hours, minutes, and seconds
    const updatedHours = Math.floor(totalMinutes / 60) % 24;
    const updatedMinutes = totalMinutes % 60;
    const updatedSeconds = seconds;

    // Format the result into "00:00:00" format
    const formattedTime = `${String(updatedHours).padStart(2, '0')}:${String(updatedMinutes).padStart(2, '0')}:${String(
      updatedSeconds
    ).padStart(2, '0')}`;

    return formattedTime;
  };

  useEffect(() => {
    getDoctorSchedules();
  }, []);

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
          title: `(${doctor.name}) ${schedule.patientName}`,
          description: 'io',
          start: combinedStart,
          end: combinedEnd,
          borderColor: schedule.statusId === '2' ? '#282828' : '#052248',
          backgroundColor: schedule.statusId === '2' ? '#282828' : '#052248',
          eventTextColor: '#fff'
        });
      });
    });
    return newData;
  };

  const getDoctorSchedules = async () => {
    await axios
      .get(`${ENDPOINT.api}schedules/only`, ENDPOINT.config)
      .then((response) => {
        setDoctorSchedules(assembleFullSchedule(response.data.response));
      })
      .catch((err) => {
        console.error('Não foi possível puxar os Médicos.' + err);
      });
  };

  const head = {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek,dayGridMonth'
  };

  return (
    <React.Fragment>
      <Row>
        <Col sm={12}></Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Agendas</Card.Title>
            </Card.Header>
            <Card.Body className="calendar">
              <FullCalendar
                defaultView="timeGridDay"
                initialView="timeGridDay"
                locales={allLocales}
                slotDuration={'00:15:00'}
                slotLabelInterval={'00:15:00'}
                locale={'pt-br'}
                headerToolbar={head}
                allDaySlot={false}
                nowIndicator={true}
                events={doctorSchedules}
                plugins={[dayGridPlugin, interaction, timeGrid]}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default Agenda;
