const day = 24.0*60*60; //тривалість земного дня у секундах
AFRAME.registerComponent('planet', {
schema: {
name: {type: 'string', default: ""}, //ім'я планети
//середня відстань планети від Сонця
dist: {type: 'number', default: 0},
mass: {type: 'number', default: 0}, //маса планети, кг
T: {type: 'number', default: 0}, //планетарний рік, земних днів
v: {type: 'array', default: [0,0,0]}, //вектор швидкості
a: {type: 'array', default: [0,0,0]}, //вектор прискорення
//координатний радіус-вектор
pos: {type: 'array', default: [0,0,0]}
},
init: function () {
this.data.T*=day; //переводимо із земних днів у секунди
this.data.pos[0]=this.data.dist; //розташовуємо на вісі x
//візуальну позицію виражаємо у мільйонах кілометрів
this.el.setAttribute('position',this.data.dist/1e9+' 0 0');
if(this.data.T!=0)//для всіх об'єктів, крім Сонця,
//обчислюємо початкову швидкість вздовж вісі y
this.data.v[1] = 2*Math.PI*this.data.dist/this.data.T;
}
});

AFRAME.registerComponent('main', {
  init: function () {
    this.solar_system = document.querySelectorAll('[planet]');
  },
  tick: function (time, deltaTime) {
    const dt = day / 3;
    const G = 6.67e-11;

    for (let i = 0; i < this.solar_system.length; i++) {
      let el_i = this.solar_system[i];
      let planet_i = el_i.components['planet'].data;

      // Скидаємо прискорення
      planet_i.a[0] = 0;
      planet_i.a[1] = 0;
      planet_i.a[2] = 0;

      for (let j = 0; j < this.solar_system.length; j++) {
        if (i === j) continue;

        let el_j = this.solar_system[j];
        let planet_j = el_j.components['planet'].data;

        let deltapos = [
          planet_j.pos[0] - planet_i.pos[0],
          planet_j.pos[1] - planet_i.pos[1],
          planet_j.pos[2] - planet_i.pos[2]
        ];

        let r = Math.sqrt(
          deltapos[0] ** 2 +
          deltapos[1] ** 2 +
          deltapos[2] ** 2
        );

        for (let k = 0; k < 3; k++) {
          planet_i.a[k] += G * planet_j.mass * deltapos[k] / (r ** 3);
        }
      }

      for (let k = 0; k < 3; k++) {
        planet_i.v[k] += planet_i.a[k] * dt;
        planet_i.pos[k] += planet_i.v[k] * dt;
      }

      el_i.setAttribute('position',
        `${planet_i.pos[0] / 1e9} ${planet_i.pos[1] / 1e9} ${planet_i.pos[2] / 1e9}`
      );
    }
  }
});