import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5005';

function AlertFeed() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let mounted = true;

    console.log('Connecting AlertFeed to:', API_URL);

    // Connect to Socket.IO
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    // Socket connected
    socket.on('connect', () => {
      console.log(
        'AlertFeed Socket.IO connected:',
        socket.id
      );
    });

    // Socket connection error
    socket.on('connect_error', (error) => {
      console.error(
        'AlertFeed Socket.IO connection error:',
        error.message
      );
    });

    // Socket disconnected
    socket.on('disconnect', (reason) => {
      console.log(
        'AlertFeed Socket.IO disconnected:',
        reason
      );
    });

    // Load previous alerts from MongoDB
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
        console.log('Alert history:', history);

        if (mounted && Array.isArray(history)) {
          setAlerts(history);
        }
      })
      .catch((error) => {
        console.error(
          'Unable to load alerts:',
          error
        );
      });

    // Receive new real-time alerts
    socket.on('alert', (alert) => {
      console.log(
        'New real-time alert:',
        alert
      );

      if (mounted) {
        setAlerts((current) => [
          alert,
          ...current,
        ].slice(0, 50));
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  return (
    <section className="panel alert-panel">

      <div className="panel-heading">

        <div>
          <p className="eyebrow">
            INCIDENT LOG
          </p>

          <h2>
            Recent alerts
          </h2>
        </div>

        <span className="metric-count">
          {alerts.length} EVENTS
        </span>

      </div>

      <div className="alert-list">

        {alerts.length === 0 && (
          <p className="empty-state">
            No alerts received.
          </p>
        )}

        {alerts.map((alert) => {

          const critical =
            alert.status
              ?.toUpperCase()
              .includes('CRITICAL');

          return (
            <article
              className={`alert-item ${
                critical ? 'critical' : ''
              }`}
              key={
                alert._id ||
                `${alert.productID}-${alert.timestamp}`
              }
            >

              <div className="alert-indicator" />

              <div className="alert-copy">

                <div className="alert-title-row">

                  <strong>
                    {alert.productID}
                  </strong>

                  <time>
                    {alert.timestamp
                      ? new Date(
                          alert.timestamp
                        ).toLocaleTimeString()
                      : 'N/A'}
                  </time>

                </div>

                <span>
                  {alert.status || 'UNKNOWN'}
                </span>

                <small>
                  Torque {alert.torque ?? 'N/A'} Nm
                  {' / '}
                  Wear {alert.toolWear ?? 'N/A'}
                  {' / '}
                  RPM {alert.rotationalSpeed ?? 'N/A'}
                </small>

              </div>

            </article>
          );
        })}

      </div>

    </section>
  );
}

export default AlertFeed;