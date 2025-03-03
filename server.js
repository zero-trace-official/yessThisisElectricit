const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/dbConfig');
const { Server } = require('socket.io');
const Battery = require('./models/Battery');
const cookieParser = require('cookie-parser');
const Device = require('./models/Device');
const events = require('events');
const authController = require('./controllers/authController');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());

// API Routes
const authRouter = require('./routes/authRouter');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// Use deviceRoutes instead of dashboardroutes
const deviceRoutes = require('./routes/deviceRoutes');
const detail = require('./routes/detail');
const statusRoutes = require('./routes/StatusRoutes');
const simRoutes = require("./routes/simRoutes");
const allRoute = require("./routes/allformRoutes");

// Initialize Admin
authController.initializeAdmin();

// Public routes: /api/auth (login, register, etc.) remain unprotected
app.use('/api/auth', authRouter);

// Mount deviceRoutes on /api/device.
// Ensure that inside deviceRoutes, only the /dashboard route is protected with verifyToken.
app.use('/api/device', deviceRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/data', detail);
app.use('/api/status', statusRoutes);
app.use("/api/sim", simRoutes);
app.use('/api/all', allRoute);

// Increase Global Max Listeners
events.defaultMaxListeners = 20;

// Socket.io
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  socket.on("newDevice", (newDevice) => {
    console.log("New Device Added:", newDevice);
    io.emit("newDevice", newDevice);
  });

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
    socket.removeAllListeners(); // Cleanup listeners
  });
});

const updateBatteryStatus = async () => {
  try {
    console.log("Fetching battery statuses...");
    const batteryStatuses = await Battery.find({}, 'uniqueid batteryLevel connectivity timestamp');
    const devices = await Device.find({}, 'brand _id');

    const devicesWithBattery = devices.map(device => {
      const battery = batteryStatuses.find(b => 
        b.uniqueid && b.uniqueid.toString() === device._id.toString()
      );
      return {
        _id: device._id,
        brand: device.brand,
        uniqueid: device._id,
        batteryLevel: battery ? battery.batteryLevel : 'N/A',
        connectivity: battery ? battery.connectivity : 'Offline'
      };
    });

    io.emit("batteryUpdate", devicesWithBattery);
  } catch (error) {
    console.error("Error updating battery status:", error);
  }
};

// Watch battery status changes
let batteryUpdateTimeout;
const batteryChangeStream = Battery.watch();
batteryChangeStream.setMaxListeners(20);

batteryChangeStream.on("change", () => {
  clearTimeout(batteryUpdateTimeout);
  batteryUpdateTimeout = setTimeout(() => {
    updateBatteryStatus();
  }, 5000);
});

const checkOfflineDevices = async () => {
  try {
    const offlineThreshold = 15000;
    const currentTime = new Date();
    const cutoffTime = new Date(currentTime - offlineThreshold);

    const offlineDevices = await Battery.find({
      $or: [
        { connectivity: "Online", timestamp: { $lt: cutoffTime } },
        { connectivity: "Offline", timestamp: { $lt: cutoffTime } }
      ]
    });

    if (offlineDevices.length > 0) {
      await Battery.updateMany(
        { uniqueid: { $in: offlineDevices.map(d => d.uniqueid) } },
        { $set: { connectivity: "Offline" } }
      );
      io.emit("batteryUpdate", offlineDevices);
    }
  } catch (error) {
    console.error("Error updating offline devices:", error);
  }
};

setInterval(checkOfflineDevices, 10000);

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
