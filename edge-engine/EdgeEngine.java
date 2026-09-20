import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.time.Duration;

import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;
import java.util.concurrent.Semaphore;


/**
 * Predictive Maintenance Edge Engine
 *
 * Concepts used:
 * 1. Producer-Consumer
 * 2. Bounded Buffer
 * 3. Priority Scheduling
 * 4. PriorityQueue
 * 5. Batch Processing
 * 6. HTTP communication with Node.js backend
 */
public class EdgeEngine {

    // ============================================================
    // CONFIGURATION
    // ============================================================

    private static final String CSV_FILE = "ai4i2020.csv";

    private static final String ALERT_ENDPOINT =
            "http://localhost:5005/api/alerts";

    private static final int BUFFER_SIZE = 15;

    private static final int BATCH_SIZE = 5;


    // ============================================================
    // HTTP CLIENT
    // ============================================================

    private static final HttpClient HTTP_CLIENT =
            HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();


    // ============================================================
    // SYNCHRONIZATION
    // ============================================================

    private static final Semaphore bufferSlots =
            new Semaphore(BUFFER_SIZE);


    // ============================================================
    // SHARED PRIORITY QUEUE
    // ============================================================

    private static final PriorityQueue<SensorTask> taskScheduler =
            new PriorityQueue<>();


    // ============================================================
    // PRODUCER FINISHED FLAG
    // ============================================================

    private static volatile boolean producerFinished = false;


    // ============================================================
    // SENSOR TASK
    // ============================================================

    static class SensorTask implements Comparable<SensorTask> {

        String productId;

        int type;

        double airTemperature;

        double processTemperature;

        double rotationalSpeed;

        double torque;

        int toolWear;

        int priority;


        SensorTask(
                String productId,
                int type,
                double airTemperature,
                double processTemperature,
                double rotationalSpeed,
                double torque,
                int toolWear,
                int priority
        ) {

            this.productId = productId;

            this.type = type;

            this.airTemperature = airTemperature;

            this.processTemperature = processTemperature;

            this.rotationalSpeed = rotationalSpeed;

            this.torque = torque;

            this.toolWear = toolWear;

            this.priority = priority;
        }


        // Higher priority comes first.
        //
        // Priority 10 = Critical
        // Priority 1  = Normal

        @Override
        public int compareTo(SensorTask other) {

            return Integer.compare(
                    other.priority,
                    this.priority
            );
        }
    }


    // ============================================================
    // MAIN
    // ============================================================

    public static void main(String[] args) {

        System.out.println(
                "=================================================="
        );

        System.out.println(
                " Predictive Maintenance Edge Engine"
        );

        System.out.println(
                " Java + Priority Scheduling"
        );

        System.out.println(
                " Backend: http://localhost:5005"
        );

        System.out.println(
                "=================================================="
        );


        Thread producer =
                new Thread(
                        EdgeEngine::producer,
                        "Producer"
                );


        Thread consumer =
                new Thread(
                        EdgeEngine::consumer,
                        "Consumer"
                );


        producer.start();

        consumer.start();


        try {

            producer.join();

            consumer.join();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            System.out.println(
                    "[MAIN ERROR] "
                            + e.getMessage()
            );
        }


        System.out.println(
                "=================================================="
        );

        System.out.println(
                " Edge Engine Finished"
        );

        System.out.println(
                "=================================================="
        );
    }


    // ============================================================
    // PRODUCER
    // ============================================================

    private static void producer() {

        try (
                BufferedReader reader =
                        new BufferedReader(
                                new FileReader(CSV_FILE)
                        )
        ) {

            // Skip CSV header

            String line = reader.readLine();


            while ((line = reader.readLine()) != null) {

                try {

                    String[] fields =
                            line.split(",");


                    // AI4I dataset columns:
                    //
                    // 0  UDI
                    // 1  Product ID
                    // 2  Type
                    // 3  Air temperature
                    // 4  Process temperature
                    // 5  Rotational speed
                    // 6  Torque
                    // 7  Tool wear


                    if (fields.length < 8) {

                        continue;
                    }


                    String productId =
                            fields[1].trim();


                    int type =
                            typeToNumber(
                                    fields[2].trim()
                            );


                    double airTemperature =
                            Double.parseDouble(
                                    fields[3].trim()
                            );


                    double processTemperature =
                            Double.parseDouble(
                                    fields[4].trim()
                            );


                    double rotationalSpeed =
                            Double.parseDouble(
                                    fields[5].trim()
                            );


                    double torque =
                            Double.parseDouble(
                                    fields[6].trim()
                            );


                    int toolWear =
                            Integer.parseInt(
                                    fields[7].trim()
                            );


                    // =================================================
                    // PRIORITY
                    // =================================================

                    int priority;

                    if (
                            torque > 60
                                    || toolWear > 200
                    ) {

                        priority = 10;

                    } else {

                        priority = 1;
                    }


                    SensorTask task =
                            new SensorTask(
                                    productId,
                                    type,
                                    airTemperature,
                                    processTemperature,
                                    rotationalSpeed,
                                    torque,
                                    toolWear,
                                    priority
                            );


                    // Wait if buffer is full

                    bufferSlots.acquire();


                    synchronized (taskScheduler) {

                        taskScheduler.offer(task);

                        taskScheduler.notifyAll();
                    }


                    System.out.printf(
                            "[PRODUCER] %s | Torque: %.2f | Wear: %d | Priority: %d%n",
                            productId,
                            torque,
                            toolWear,
                            priority
                    );


                } catch (Exception e) {

                    System.out.println(
                            "[PRODUCER ERROR] "
                                    + e.getMessage()
                    );
                }
            }


        } catch (IOException e) {

            System.out.println(
                    "[CSV ERROR] "
                            + e.getMessage()
            );

        } finally {

            producerFinished = true;


            synchronized (taskScheduler) {

                taskScheduler.notifyAll();
            }
        }
    }


    // ============================================================
    // CONSUMER
    // ============================================================

    private static void consumer() {

        while (true) {

            List<SensorTask> batch =
                    new ArrayList<>();


            // =====================================================
            // COLLECT BATCH
            // =====================================================

            synchronized (taskScheduler) {

                while (
                        taskScheduler.isEmpty()
                                && !producerFinished
                ) {

                    try {

                        taskScheduler.wait();

                    } catch (InterruptedException e) {

                        Thread.currentThread().interrupt();

                        return;
                    }
                }


                // Producer finished and nothing remains

                if (
                        taskScheduler.isEmpty()
                                && producerFinished
                ) {

                    break;
                }


                // Collect up to BATCH_SIZE

                while (
                        !taskScheduler.isEmpty()
                                && batch.size() < BATCH_SIZE
                ) {

                    batch.add(
                            taskScheduler.poll()
                    );
                }
            }


            // =====================================================
            // PROCESS BATCH
            // =====================================================

            for (SensorTask task : batch) {

                processTask(task);

                bufferSlots.release();
            }


            System.out.println(
                    "--------------------------------------------------"
            );
        }
    }


    // ============================================================
    // PROCESS TASK
    // ============================================================

    private static void processTask(
            SensorTask task
    ) {

        boolean critical =
                task.priority >= 10;


        if (critical) {

            System.out.printf(
                    "[ALERT] CRITICAL FAULT -> Machine: %s | Torque: %.2f Nm | Wear: %d | RPM: %.0f | Priority: %d%n",
                    task.productId,
                    task.torque,
                    task.toolWear,
                    task.rotationalSpeed,
                    task.priority
            );

        } else {

            System.out.printf(
                    "[NORMAL] %s | Torque: %.2f | Wear: %d | Priority: %d%n",
                    task.productId,
                    task.torque,
                    task.toolWear,
                    task.priority
            );
        }


        // =========================================================
        // STATUS
        // =========================================================

        String status;

        if (critical) {

            status =
                    "CRITICAL FAULT PREDICTED";

        } else {

            status =
                    "NORMAL";
        }


        // =========================================================
        // SEND TO BACKEND
        // =========================================================

        sendAlert(
                task,
                status
        );
    }


    // ============================================================
    // SEND ALERT TO NODE.JS
    // ============================================================

    private static void sendAlert(
            SensorTask task,
            String status
    ) {

        try {

            String payload =
                    String.format(
                            "{\"productID\":\"%s\","
                                    + "\"torque\":%.2f,"
                                    + "\"toolWear\":%d,"
                                    + "\"rotationalSpeed\":%.0f,"
                                    + "\"status\":\"%s\"}",
                            escapeJson(
                                    task.productId
                            ),
                            task.torque,
                            task.toolWear,
                            task.rotationalSpeed,
                            escapeJson(status)
                    );


            System.out.println(
                    "[HTTP] Sending -> "
                            + task.productId
            );


            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(
                                    URI.create(
                                            ALERT_ENDPOINT
                                    )
                            )
                            .timeout(
                                    Duration.ofSeconds(10)
                            )
                            .header(
                                    "Content-Type",
                                    "application/json"
                            )
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .POST(
                                    HttpRequest.BodyPublishers
                                            .ofString(payload)
                            )
                            .build();


            HttpResponse<String> response =
                    HTTP_CLIENT.send(
                            request,
                            HttpResponse.BodyHandlers
                                    .ofString()
                    );


            System.out.println(
                    "[HTTP RESPONSE] "
                            + task.productId
                            + " -> HTTP "
                            + response.statusCode()
            );


            if (
                    response.statusCode() >= 200
                            && response.statusCode() < 300
            ) {

                System.out.println(
                        "[BACKEND OK] "
                                + task.productId
                                + " saved successfully"
                );

            } else {

                System.out.println(
                        "[BACKEND ERROR] "
                                + task.productId
                                + " -> "
                                + response.body()
                );
            }


        } catch (Exception e) {

            System.out.println(
                    "[HTTP ERROR] "
                            + task.productId
                            + " -> "
                            + e.getClass()
                            .getSimpleName()
                            + " : "
                            + e.getMessage()
            );
        }
    }


    // ============================================================
    // ESCAPE JSON
    // ============================================================

    private static String escapeJson(
            String value
    ) {

        if (value == null) {

            return "";
        }


        return value
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "\"",
                        "\\\""
                );
    }


    // ============================================================
    // TYPE CONVERSION
    // ============================================================

    private static int typeToNumber(
            String type
    ) {

        switch (type.toUpperCase()) {

            case "L":
                return 1;

            case "M":
                return 2;

            case "H":
                return 3;

            default:
                return 0;
        }
    }
}