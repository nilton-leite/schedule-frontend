import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
function schedulesPDF(schedules) {
    console.log(schedules);
    const reportTitle = [
        {
            text: 'Agendamentos do Dia',
            fontSize: 15,
            bold: true,
            margin: [15, 20, 0, 45] // left, top, right, bottom
        }
    ];

    const dados = schedules.map((schedule) => {
        return [
            {text: schedule.scheduleId, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.type, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.name, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.patientName, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.data, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.time, fontSize: 9, margin: [0, 2, 0, 2]},
            {text: schedule.statusName, fontSize: 9, margin: [0, 2, 0, 2]}
        ] 
    });

    const details = [
        {
            table:{
                headerRows: 1,
                widths: [35, 58, 110, 110, 50, 40, 50],
                body: [
                    [
                        {text: 'Código', style: 'tableHeader', fontSize: 10},
                        {text: 'Tipo', style: 'tableHeader', fontSize: 10},
                        {text: 'Médico', style: 'tableHeader', fontSize: 10},
                        {text: 'Paciente', style: 'tableHeader', fontSize: 10},
                        {text: 'Data', style: 'tableHeader', fontSize: 10},
                        {text: 'Hora', style: 'tableHeader', fontSize: 10},
                        {text: 'Status', style: 'tableHeader', fontSize: 10}
                    ],
                    ...dados
                ]
            },
            layout: 'lightHorizontalLines' // headerLineOnly
        }
    ];

    function Rodape(currentPage, pageCount){
        return [
            {
                text: currentPage + ' / ' + pageCount,
                alignment: 'right',
                fontSize: 9,
                margin: [0, 10, 20, 0] // left, top, right, bottom
            }
        ]
    }

    const docDefinitios = {
        pageSize: 'A4',
        pageMargins: [15, 50, 15, 40],

        header: [reportTitle],
        content: [details],
        footer: Rodape
    }

    pdfMake.createPdf(docDefinitios).open();


}

export default schedulesPDF;