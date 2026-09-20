import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

import { Line } from 'react-chartjs-2';


// =====================================================
// CHART.JS REGISTRATION
// =====================================================

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:5005';

const MAX_POINTS = 100;


// =====================================================
// DASHBOARD COMPONENT
// =====================================================

function Dashboard() {

  const [alerts, setAlerts] = useState([]);


  useEffect(() => {

    let mounted = true;


    console.log(
      'Connecting Dashboard to:',
      API_URL
    );


    // =================================================
    // SOCKET.IO CONNECTION
    // =================================================

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });


    socket.on('connect', () => {

      console.log(
        'Dashboard Socket.IO connected:',
        socket.id
      );

    });


    socket.on('connect_error', (error) => {

      console.error(
        'Dashboard Socket.IO error:',
        error.message
      );

    });


    socket.on('disconnect', (reason) => {

      console.log(
        'Dashboard Socket.IO disconnected:',
        reason
      );

    });


    // =================================================
    // LOAD ALERT HISTORY
    // =================================================

    fetch(`${API_URL}/api/alerts`)

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}`
          );
        }

        return response.json();

      })

      .then((history) => {

        console.log(
          'Dashboard alert history:',
          history
        );

        if (
          mounted &&
          Array.isArray(history)
        ) {

          // Backend sends newest first.
          // Reverse so chart displays oldest → newest.
          setAlerts(
            [...history]
              .reverse()
              .slice(-MAX_POINTS)
          );

        }

      })

      .catch((error) => {

        console.error(
          'Unable to load alert history:',
          error
        );

      });


    // =================================================
    // RECEIVE REAL-TIME ALERT
    // =================================================

    socket.on('alert', (alert) => {

      console.log(
        'Dashboard received alert:',
        alert
      );

      if (mounted) {

        setAlerts((current) => [
          ...current,
          alert,
        ].slice(-MAX_POINTS));

      }

    });


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      mounted = false;

      socket.disconnect();

    };

  }, []);


  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = {

    labels: alerts.map(
      (alert) =>
        alert.productID || 'Unknown'
    ),

    datasets: [

      {
        label: 'Torque (Nm)',

        data: alerts.map(
          (alert) =>
            Number(alert.torque) || 0
        ),

        borderColor: '#55d6be',

        backgroundColor:
          'rgba(85, 214, 190, 0.12)',

        fill: true,

        tension: 0.35,
      },

      {
        label: 'Tool Wear',

        data: alerts.map(
          (alert) =>
            Number(alert.toolWear) || 0
        ),

        borderColor: '#f5a65b',

        backgroundColor:
          'rgba(245, 166, 91, 0.08)',

        fill: true,

        tension: 0.35,
      },

    ],
  };


  // =====================================================
  // CHART OPTIONS
  // =====================================================

  const chartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    animation: {
      duration: 350,
    },

    plugins: {

      legend: {
        labels: {
          color: '#a6b4c3',
          usePointStyle: true,
        },
      },

      tooltip: {
        mode: 'index',
        intersect: false,
      },

    },

    scales: {

      x: {

        ticks: {
          color: '#718096',
        },

        grid: {
          color:
            'rgba(166, 180, 195, 0.08)',
        },

      },

      y: {

        ticks: {
          color: '#718096',
        },

        grid: {
          color:
            'rgba(166, 180, 195, 0.08)',
        },

      },

    },

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <section className="panel dashboard-panel">

      <div className="panel-heading">

        <div>

          <p className="eyebrow">
            TELEMETRY
          </p>

          <h2>
            Machine signal history
          </h2>

        </div>

        <span className="metric-count">
          {alerts.length} POINTS
        </span>

      </div>


      <div
        className="chart-wrap"
        style={{
          position: 'relative',
          height: '350px',
        }}
      >

        {alerts.length > 0 ? (

          <Line
            data={chartData}
            options={chartOptions}
          />

        ) : (

          <p className="empty-state">
            Waiting for telemetry...
          </p>

        )}

      </div>

    </section>

  );
}


export default Dashboard;