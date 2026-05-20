const { contextBridge, ipcRenderer } = require('electron');


// Expose a safe API to the renderer process for authentication, customer, credit, payment, and credit detail operations
const electronApi = {
  auth: {
    login: (loginData) => ipcRenderer.invoke('auth:login', loginData),
    register: (registerData) => ipcRenderer.invoke('auth:register', registerData),
  },

  customer: {
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    add: (customerData) => ipcRenderer.invoke('customer:add', customerData),
    update: (customerData) => ipcRenderer.invoke('customer:update', customerData),
    delete: (customerId) => ipcRenderer.invoke('customer:delete', customerId),
  },

  credit: {
    getAll: () => ipcRenderer.invoke('credit:getAll'),
    getByCustomer: (customerId) => ipcRenderer.invoke('credit:getByCustomer', customerId),
    add: (creditData) => ipcRenderer.invoke('credit:add', creditData),
    update: (creditData) => ipcRenderer.invoke('credit:update', creditData),
    delete: (creditId) => ipcRenderer.invoke('credit:delete', creditId),
  },

  payment: {
    getAll: () => ipcRenderer.invoke('payment:getAll'),
    getByCustomer: (customerId) => ipcRenderer.invoke('payment:getByCustomer', customerId),
    add: (paymentData) => ipcRenderer.invoke('payment:add', paymentData),
    delete: (paymentId) => ipcRenderer.invoke('payment:delete', paymentId),
  },

  creditDetail: {
    getByCredit: (creditId) => ipcRenderer.invoke('creditDetail:getByCredit', creditId),
    add: (creditDetailData) => ipcRenderer.invoke('creditDetail:add', creditDetailData),
  },
};

contextBridge.exposeInMainWorld('api', electronApi);

console.log('Electron preload loaded successfully.');