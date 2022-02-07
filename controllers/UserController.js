class UserController {

  constructor(formIdCreate, formIdUpdate, tableId) {

    this.formEl = document.querySelector(formIdCreate);
    this.formUpdateEl = document.querySelector(formIdUpdate);
    this.tableEl = document.querySelector(tableId);

    this.onSubmit();
    this.onEdit();
    this.selectAll();

  }

  onEdit() {

    document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {
      this.showPanelCreate();
    });

    this.formUpdateEl.addEventListener("submit", event => {
      event.preventDefault();

      let btn = this.formUpdateEl.querySelector("[type=submit]");
      btn.disabled = true;

      let values = this.getValues(this.formUpdateEl);

      // recuperamos o index da linha do DATASET
      let index = this.formUpdateEl.dataset.trIndex;

      // pega o tr do index passado
      let tr = this.tableEl.rows[index];

      /**
       * ao editar o usuario a foto nao vem por padrao no novo objeto
       * (porque ela eh passada por callback e so depois convertida em string)
       * desta forma precisamos da foto que tenha no obj user antigo
       * para podermos colocar como padrao quando formos editar o usuario
       */
      let userOld = JSON.parse(tr.dataset.user);
      /**
       * {} -> userOld -> values
       * * {} -> userOld (substitui este objeto vazio.. [criando um novo])
       * * se nao ele substituiria a propria variavel
       * * * userOld -> values .. ai começa as copias
       * * *
       * o assign cria uma copia (velho -> novo)
       * substituindo os valores que nao existiam pelos novos
       */
      let result = Object.assign({}, userOld, values);

      this.getPhoto(this.formUpdateEl).then(
        (content) => {
          // porem a foto substituiu por "", pq no novo n tem valor da foto
          // ai precisamos fazer uma validacao
          if (!values.photo) {
            result._photo = userOld._photo;
          } else {
            result._photo = content;
          }

          // precisamos passar a instancia do obj User()
          let user = new User();
          user.loadFromJSON(result);

          // save editar usuario
          user.save();

          // EDITAR: sobrescrevendo tr ja existente
          this.getTr(user, tr);

          this.updateCount();

          this.formUpdateEl.reset();

          this.showPanelCreate();

          btn.disabled = false;

        },
        (error) => {
          console.error(error);
        }
      );

    });

  }

  onSubmit() {

    this.formEl.addEventListener("submit", event => {
      event.preventDefault();

      let btn = this.formEl.querySelector("[type=submit]");
      btn.disabled = true;

      let values = this.getValues(this.formEl);

      // se na resposta do getValues vier um false no lugar de um new User
      // cancelamos o envio deste formulario
      // fazendo a verificacao e retornando false
      if (!values) return false;

      this.getPhoto(this.formEl).then(
        (content) => {
          values.photo = content;

          // save novo usuario
          values.save();

          this.addLine(values);

          this.formEl.reset();
          btn.disabled = false;

        },
        (error) => {
          console.error(error);
        }
      );

    });

  }

  getPhoto(formEl) {

    return new Promise((resolve, reject) => {
      let fileReader = new FileReader();

      let elements = [...formEl.elements].filter(item => {
        if (item.name === 'photo') {
          return item;
        }
      });

      let file = elements[0].files[0];

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (e) => {
        reject(e);
      };

      if (file) {
        fileReader.readAsDataURL(file);
      } else {
        resolve('dist/img/boxed-bg.jpg');
      }

    });

  }

  getValues(formEl) {

    let user = {};
    let isValid = true;

    [...formEl.elements].forEach((field, index) => {

      /**
       * validando campos
       * é o campo que estou procurando && ele esta vazio
      */
      if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

        field.parentElement.classList.add('has-error');
        isValid = false;

      }

      if (field.name == "gender") {
        if (field.checked) {
          user[field.name] = field.value;
        }

      } else if (field.name === "admin") {
        user[field.name] = field.checked;

      } else {
        user[field.name] = field.value;

      }
    });

    if (!isValid) {
      return false;

    } else {
      return new User(
        user.name,
        user.gender,
        user.birth,
        user.country,
        user.email,
        user.password,
        user.photo,
        user.admin
      );
    }

  }

  selectAll() {

    let users = User.getUsersStorage();

    users.forEach(dataUser => {

      let user = new User();

      /**
       * recebemos um dataUser .. (problema dos atb virem com um _ antes)
       * agora precisamos transformar este JSON em uma instancia de um User()
       * ai criamos um metodo que fara isso.
       */
      user.loadFromJSON(dataUser);

      this.addLine(user);

    });

  }

  addLine(dataUser) {

    let tr = this.getTr(dataUser);

    this.tableEl.appendChild(tr);

    this.updateCount();

  }

  // tr = null (segundo parametro opcional)
  getTr(dataUser, tr = null) {

    if (tr === null) tr = document.createElement("tr");

    tr.dataset.user = JSON.stringify(dataUser);

    tr.innerHTML = `
      <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
      <td>${dataUser.name}</td>
      <td>${dataUser.email}</td>
      <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
      <td>${Utils.dateFormat(dataUser.register)}</td>
      <td>
        <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
        <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
      </td>
    `;

    this.addEventsTr(tr);

    return tr;

  }

  addEventsTr(tr) {

    tr.querySelector(".btn-delete").addEventListener("click", e => {
      if (confirm("Deseja realmente excluir?")) {

        let user = new User();
        user.loadFromJSON(JSON.parse(tr.dataset.user));
        user.remove();

        tr.remove();
        this.updateCount();
      }
    });

    tr.querySelector(".btn-edit").addEventListener("click", e => {
      // pegando dados DATASET
      let json = JSON.parse(tr.dataset.user);

      /**
       * passamos o index da table por DATASET
       * para poder editar a view na linha exata
       * em que atualizamos o nosso registro
       */
      this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

      for (let name in json) {
        /**
         * procurando o campo name do json no seletor
         * fazendo assim o par de valores
         * replace (pq a minha propriedade do json tem um _ no comeco.. ex: _nome)
         */
        let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");
        // agora atribuimos os msm valores (name = name, email = email, ...)
        /**
          * porem nem todos os campos tem value (tem o register q nao esta no form por exemplo)
          * para isso resolveremos assim
        */
        if (field) {

          switch (field.type) {
            case 'file':
              continue;
              break;

            case 'radio':
              // como tem 2 valores - M | F -> precisamos localizar o value
              field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
              // so ai entao atribuimos o checked ao valor
              field.checked = true;
              break;

            case 'checkbox':
              field.checked = json[name];
              break;

            default:
              field.value = json[name];
          }

        }

      }

      // carrega a foto quando editar um usuario
      this.formUpdateEl.querySelector(".photo").src = json._photo;

      this.showPanelUpdate();

    });

  }

  showPanelCreate() {
    document.querySelector("#box-user-create").style.display = "block";
    document.querySelector("#box-user-update").style.display = "none";
  }

  showPanelUpdate() {
    document.querySelector("#box-user-create").style.display = "none";
    document.querySelector("#box-user-update").style.display = "block";
  }

  updateCount() {

    let numberUsers = 0;
    let numberAdmin = 0;

    /**
     * este elemento nao eh um array
     * por isso fazemos um spred
     * para poder usar o forEach nele
    */
    [...this.tableEl.children].forEach(tr => {

      // usuarios
      numberUsers++;

      // administradores
      let user = JSON.parse(tr.dataset.user);
      if (user._admin) numberAdmin++;

    });

    document.querySelector("#number-users").innerHTML = numberUsers;
    document.querySelector("#number-users-admin").innerHTML = numberAdmin;

  }

}
