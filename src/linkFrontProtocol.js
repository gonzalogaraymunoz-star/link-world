export const LINK_FRONT_PROTOCOL = Object.freeze({
  version: '1.0',
  routes: {
    explain: '/que-es-link/',
    join: '/ser-parte/',
    privateWorld: '/'
  },
  labels: {
    explain: '¿Qué es LINK?',
    join: 'Ser parte de LINK World',
    contact: 'Preparar conversación',
    member: 'Ya soy parte'
  },
  precontact: {
    required: ['name','business','instagram','email','interest'],
    verificationRequiredBeforeMicelio: true
  },
  whatsapp: {
    directLinksAllowed: false,
    requiresPrecontactForm: true,
    rule: 'Todo acceso a WhatsApp debe ocurrir después de completar y registrar un formulario de contacto.'
  },
  flow: [
    'front',
    'explain',
    'join',
    'precontact',
    'whatsapp',
    'meeting',
    'verification',
    'micelio'
  ]
});
