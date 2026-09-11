// Datos precargados extraídos del archivo oficial de asistencia de Vóley
export const defaultDivisions = [
  {
    id: 'sub-11',
    name: 'Sub 11',
    code: 'SUB11',
    category: 'Infantil Inicial',
    ageRange: '8 - 11 años',
    color: '#8f142d',
    description: 'Iniciación deportiva, coordinación motriz y familiarización con el balón.'
  },
  {
    id: 'benjamin-11',
    name: 'Benjamín 11',
    code: 'BENJ11',
    category: 'Formativa',
    ageRange: '9 - 11 años',
    color: '#a81c3c',
    description: 'Desarrollo de fundamentos técnicos básicos y juegos reducidos (minivoley).'
  },
  {
    id: 'alevin',
    name: 'Alevín',
    code: 'ALEVIN',
    category: 'Formativa Base',
    ageRange: '11 - 12 años',
    color: '#731024',
    description: 'Consolidación de golpe de dedos, antebrazos y servicio básico por abajo.'
  },
  {
    id: 'sub-13',
    name: 'Sub 13',
    code: 'SUB13',
    category: 'Menores',
    ageRange: '12 - 13 años',
    color: '#9e1b38',
    description: 'Inicio de sistemas tácticos básicos (6-6 / 4-2), remate y saque tenis.'
  },
  {
    id: 'sub-15',
    name: 'Sub 15',
    code: 'SUB15',
    category: 'Pre-Juvenil',
    ageRange: '14 - 15 años',
    color: '#b52547',
    description: 'Especialización posicional, bloqueo individual, recepción dirigida y ataque zonificado.'
  },
  {
    id: 'sub-17',
    name: 'Sub 17',
    code: 'SUB17',
    category: 'Juvenil',
    ageRange: '16 - 17 años',
    color: '#700c22',
    description: 'Sistemas avanzados (5-1), velocidad de juego, defensa de campo y contraataque.'
  },
  {
    id: 'sub-19',
    name: 'Sub 19',
    code: 'SUB19',
    category: 'Mayor / Élite',
    ageRange: '18 - 19 años',
    color: '#570819',
    description: 'Rendimiento competitivo, fuerza explosiva y alta exigencia técnica.'
  }
];

export const defaultStudents = [
  // SUB 13
  { id: 's1', name: 'Avigail Cohen', divisionId: 'sub-13', birthDate: '2013-03-15', jerseyNumber: '4', position: 'Armadora' },
  { id: 's2', name: 'Samara Pérez', divisionId: 'sub-13', birthDate: '2013-05-20', jerseyNumber: '7', position: 'Punta' },
  { id: 's3', name: 'Valentina Tamara', divisionId: 'sub-13', birthDate: '2013-01-11', jerseyNumber: '9', position: 'Central' },
  { id: 's4', name: 'Valentina Palacio', divisionId: 'sub-13', birthDate: '2013-08-14', jerseyNumber: '11', position: 'Opuesta' },
  { id: 's5', name: 'Gabriela Colón', divisionId: 'sub-13', birthDate: '2013-06-25', jerseyNumber: '2', position: 'Líbero' },
  { id: 's6', name: 'Gabriela Alemán', divisionId: 'sub-13', birthDate: '2013-09-03', jerseyNumber: '5', position: 'Punta' },
  { id: 's7', name: 'Sara Benites', divisionId: 'sub-13', birthDate: '2013-11-18', jerseyNumber: '8', position: 'Central' },
  { id: 's8', name: 'Valeria Beltrán', divisionId: 'sub-13', birthDate: '2013-04-09', jerseyNumber: '10', position: 'Punta' },
  { id: 's9', name: 'Gabriela Benítez', divisionId: 'sub-13', birthDate: '2013-07-22', jerseyNumber: '12', position: 'Armadora' },

  // ALEVIN
  { id: 's10', name: 'Valeria Méndez', divisionId: 'alevin', birthDate: '2014-02-14', jerseyNumber: '3', position: 'Punta' },
  { id: 's11', name: 'Jailyn Lorduy', divisionId: 'alevin', birthDate: '2014-04-18', jerseyNumber: '6', position: 'Central' },
  { id: 's12', name: 'Carla Millán', divisionId: 'alevin', birthDate: '2014-06-08', jerseyNumber: '1', position: 'Armadora' },
  { id: 's13', name: 'Sofía Nieves', divisionId: 'alevin', birthDate: '2014-09-19', jerseyNumber: '8', position: 'Líbero' },
  { id: 's14', name: 'Mariana Flórez', divisionId: 'alevin', birthDate: '2014-01-30', jerseyNumber: '14', position: 'Opuesta' },
  { id: 's15', name: 'Emilia Gómez', divisionId: 'alevin', birthDate: '2014-11-05', jerseyNumber: '5', position: 'Punta' },
  { id: 's16', name: 'Antonella Abad', divisionId: 'alevin', birthDate: '2014-03-27', jerseyNumber: '9', position: 'Punta' },
  { id: 's17', name: 'Sofía Cumplido', divisionId: 'alevin', birthDate: '2014-07-16', jerseyNumber: '11', position: 'Central' },
  { id: 's18', name: 'Emily Julio', divisionId: 'alevin', birthDate: '2014-10-12', jerseyNumber: '7', position: 'Armadora' },
  { id: 's19', name: 'Samara Gómez', divisionId: 'alevin', birthDate: '2014-05-23', jerseyNumber: '13', position: 'Líbero' },
  { id: 's20', name: 'Victoria Gallego', divisionId: 'alevin', birthDate: '2014-08-01', jerseyNumber: '15', position: 'Opuesta' },
  { id: 's21', name: 'Ziiari Pérez', divisionId: 'alevin', birthDate: '2014-12-04', jerseyNumber: '2', position: 'Punta' },

  // BENJAMIN 11
  { id: 's22', name: 'Manuela Barrios', divisionId: 'benjamin-11', birthDate: '2015-05-10', jerseyNumber: '4', position: 'General' },
  { id: 's23', name: 'Valeria Llanos Pérez', divisionId: 'benjamin-11', birthDate: '2015-08-21', jerseyNumber: '9', position: 'General' },

  // SUB 15
  { id: 's24', name: 'Sofía Ricardo', divisionId: 'sub-15', birthDate: '2011-02-17', jerseyNumber: '10', position: 'Punta' },
  { id: 's25', name: 'Valeria Gallego', divisionId: 'sub-15', birthDate: '2011-04-05', jerseyNumber: '7', position: 'Armadora' },
  { id: 's26', name: 'Milagro Zarza', divisionId: 'sub-15', birthDate: '2011-06-12', jerseyNumber: '3', position: 'Central' },
  { id: 's27', name: 'Ana Sofía Chávez', divisionId: 'sub-15', birthDate: '2011-09-28', jerseyNumber: '12', position: 'Punta' },
  { id: 's28', name: 'Luisa Torres', divisionId: 'sub-15', birthDate: '2011-03-14', jerseyNumber: '5', position: 'Líbero' },
  { id: 's29', name: 'Gabriela Fernández', divisionId: 'sub-15', birthDate: '2011-11-20', jerseyNumber: '8', position: 'Opuesta' },
  { id: 's30', name: 'Valentina Villegas', divisionId: 'sub-15', birthDate: '2011-01-22', jerseyNumber: '6', position: 'Central' },
  { id: 's31', name: 'Sara Acosta', divisionId: 'sub-15', birthDate: '2011-07-09', jerseyNumber: '1', position: 'Armadora' },
  { id: 's32', name: 'Sara Millán', divisionId: 'sub-15', birthDate: '2011-08-30', jerseyNumber: '14', position: 'Punta' },
  { id: 's33', name: 'Yuliana Bellido', divisionId: 'sub-15', birthDate: '2011-10-15', jerseyNumber: '11', position: 'Central' },
  { id: 's34', name: 'Maricela Mendoza', divisionId: 'sub-15', birthDate: '2011-12-03', jerseyNumber: '2', position: 'Líbero' },
  { id: 's35', name: 'María Belén Cohen', divisionId: 'sub-15', birthDate: '2011-05-18', jerseyNumber: '15', position: 'Punta' },
  { id: 's36', name: 'Hilary Girado', divisionId: 'sub-15', birthDate: '2011-04-29', jerseyNumber: '9', position: 'Opuesta' },
  { id: 's37', name: 'Mariana Benítez', divisionId: 'sub-15', birthDate: '2011-09-07', jerseyNumber: '16', position: 'Central' },
  { id: 's38', name: 'Dayanli Yánez', divisionId: 'sub-15', birthDate: '2011-06-24', jerseyNumber: '13', position: 'Punta' },
  { id: 's39', name: 'María Belén Vergara', divisionId: 'sub-15', birthDate: '2011-02-11', jerseyNumber: '4', position: 'Armadora' },
  { id: 's40', name: 'Salomé Arismendi', divisionId: 'sub-15', birthDate: '2011-11-01', jerseyNumber: '17', position: 'Punta' },
  { id: 's41', name: 'Luisa Díaz', divisionId: 'sub-15', birthDate: '2011-07-19', jerseyNumber: '18', position: 'Central' },
  { id: 's42', name: 'Lussiana Lora', divisionId: 'sub-15', birthDate: '2011-03-08', jerseyNumber: '19', position: 'Líbero' },
  { id: 's43', name: 'Yeraldin Morales', divisionId: 'sub-15', birthDate: '2011-12-14', jerseyNumber: '20', position: 'Punta' },
  { id: 's44', name: 'Valerie Salcedo', divisionId: 'sub-15', birthDate: '2011-08-04', jerseyNumber: '21', position: 'Opuesta' },
  { id: 's45', name: 'Gabriela Rincón', divisionId: 'sub-15', birthDate: '2011-10-25', jerseyNumber: '22', position: 'Central' },
  { id: 's46', name: 'Mariángel Álvarez', divisionId: 'sub-15', birthDate: '2011-05-02', jerseyNumber: '23', position: 'Punta' },
  { id: 's47', name: 'Keily Álvarez', divisionId: 'sub-15', birthDate: '2011-01-16', jerseyNumber: '24', position: 'Armadora' },
  { id: 's48', name: 'Sarahí Ortega', divisionId: 'sub-15', birthDate: '2011-09-12', jerseyNumber: '25', position: 'Líbero' },

  // SUB 17
  { id: 's49', name: 'Zhayra', divisionId: 'sub-17', birthDate: '2009-04-14', jerseyNumber: '10', position: 'Punta' },
  { id: 's50', name: 'Karolay Lidueña', divisionId: 'sub-17', birthDate: '2009-08-22', jerseyNumber: '7', position: 'Central' },
  { id: 's51', name: 'Paulina Ricardo', divisionId: 'sub-17', birthDate: '2009-03-10', jerseyNumber: '5', position: 'Armadora' },
  { id: 's52', name: 'Laura Molina', divisionId: 'sub-17', birthDate: '2009-11-29', jerseyNumber: '2', position: 'Líbero' },
  { id: 's53', name: 'María Fátima', divisionId: 'sub-17', birthDate: '2009-06-17', jerseyNumber: '9', position: 'Opuesta' },
  { id: 's54', name: 'Estephy Tamara', divisionId: 'sub-17', birthDate: '2009-01-25', jerseyNumber: '4', position: 'Punta' },
  { id: 's55', name: 'Maribella Díaz Garcés', divisionId: 'sub-17', birthDate: '2009-10-08', jerseyNumber: '11', position: 'Central' },
  { id: 's56', name: 'Luciana Domínguez', divisionId: 'sub-17', birthDate: '2009-07-03', jerseyNumber: '13', position: 'Punta' }
];

export const defaultExerciseCatalog = [
  {
    id: 'ex-1',
    name: 'Saque Flotante / Tenis',
    category: 'Servicio',
    description: 'Precisión hacia zona 1, 5 y 6, altura sobre la red y trayectoria sin rotación.',
    maxScore: 10
  },
  {
    id: 'ex-2',
    name: 'Recepción de Antebrazos',
    category: 'Recepción',
    description: 'Postura base baja, plataforma de brazos estable y envío de balón en parábola a posición 2-3.',
    maxScore: 10
  },
  {
    id: 'ex-3',
    name: 'Pase de Dedos / Colocación',
    category: 'Armado',
    description: 'Triángulo de dedos, impulso de piernas, contacto suave y precisión a altura óptima.',
    maxScore: 10
  },
  {
    id: 'ex-4',
    name: 'Ataque / Remate Zona 4 y 2',
    category: 'Ataque',
    description: 'Carrera de aproximación, batida a dos pies, golpe en punto más alto y muñequeo hacia cancha rival.',
    maxScore: 10
  },
  {
    id: 'ex-5',
    name: 'Bloqueo Individual y Doble',
    category: 'Defensa Red',
    description: 'Desplazamiento lateral en paso cruzado, penetración de manos sobre la red y caída equilibrada.',
    maxScore: 10
  },
  {
    id: 'ex-6',
    name: 'Defensa de Campo y Apoyo',
    category: 'Defensa',
    description: 'Lectura de hombro del atacante, reacción al balón desviado y plancha/rodada de emergencia.',
    maxScore: 10
  },
  {
    id: 'ex-7',
    name: 'Resistencia y Desplazamiento',
    category: 'Físico',
    description: 'Suicidios de cancha, velocidad de reacción de espaldas y recuperación rápida a posición base.',
    maxScore: 10
  }
];
