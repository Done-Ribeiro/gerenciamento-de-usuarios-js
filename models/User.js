class User {

  constructor(name, gender, birth, country, email, password, photo, admin) {

    this._id;
    this._name = name;
    this._gender = gender;
    this._birth = birth;
    this._country = country;
    this._email = email;
    this._password = password;
    this._photo = photo;
    this._admin = admin;
    this._register = new Date();

  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get gender() {
    return this._gender;
  }

  get birth() {
    return this._birth;
  }

  get country() {
    return this._country;
  }

  get email() {
    return this._email;
  }

  get password() {
    return this._password;
  }

  get photo() {
    return this._photo;
  }

  set photo(value) {
    this._photo = value;
  }

  get admin() {
    return this._admin;
  }

  get register() {
    return this._register;
  }

  loadFromJSON(json) {
    for (let name in json) {

      switch (name) {
        case '_register':
          this[name] = new Date(json[name]);
          break;
        default:
          this[name] = json[name];
      }

    }
  }

  static getUsersStorage() {

    let users = [];

    // verifica se tem usuarios cadastrados
    if (localStorage.getItem("users")) {
      users = JSON.parse(localStorage.getItem("users"));
    }

    return users;

  }

  getNewID() {

    if (!window.id) window.id = 0;

    id++;

    return id;

  }

  save() {

    // retorna todos usuarios localStorage | cria um array | salva em users
    let users = User.getUsersStorage();

    if (this.id > 0) {
      
      // buscando o obj por ID
      users.map(u => {

        if (u._id == this._id) {

          Object.assign(u, this);

        }

        return u;

      });

    } else {

      // gerar novo ID
      this._id = this.getNewID();

      users.push(this);

    }

    localStorage.setItem("users", JSON.stringify(users));

  }

};
