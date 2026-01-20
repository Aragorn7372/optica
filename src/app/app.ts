import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Validadores personalizados
function emailValidator(control: AbstractControl): ValidationErrors | null {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return control.value && !emailRegex.test(control.value) ? { invalidEmail: true } : null;
}

function telefonoValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null; // Opcional
  const telefonoRegex = /^[679]\d{8}$/;
  return ! telefonoRegex.test(control.value) ? { invalidTelefono: true } : null;
}

function cpValidator(control: AbstractControl): ValidationErrors | null {
  const cpRegex = /^\d{5}$/;
  return control.value && !cpRegex.test(control.value) ? { invalidCP: true } : null;
}

function fechaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return { required: true };

  const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = control.value.match(fechaRegex);

  if (!match) return { invalidFormat: true };

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date. getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return { invalidDate: true };
  }

  if (date < today) {
    return { pastDate: true };
  }

  return null;
}

@Component({
  selector:  'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('optica');
  optica: FormGroup;
  formSubmitted = false;

  // Mapa de provincias por código postal
  private provinciasMap:  { [key: string]: string } = {
    '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
    '05': 'Ávila', '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona',
    '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
    '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16':  'Cuenca',
    '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
    '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
    '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
    '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
    '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
    '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39':  'Cantabria',
    '40':  'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
    '44':  'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
    '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
  };

  constructor(private formBuilder: FormBuilder) {
    this.optica = this.formBuilder.group({
      checkbox: [false, Validators.requiredTrue],
      comentario:  [''],
      email: ['', [Validators.required, emailValidator]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', telefonoValidator],
      cp:  ['', [Validators.required, cpValidator]],
      provincia:  [{ value: '', disabled: true }],
      tipo: ['', Validators.required],
      dolencias: [[]],
      fecha: ['', [Validators.required, fechaValidator]],
    });
  }

  ngOnInit(): void {
    // Listener para actualizar provincia automáticamente
    this.optica.get('cp')?.valueChanges.subscribe(cp => {
      this.updateProvincia(cp);
    });
  }

  updateProvincia(cp: string): void {
    if (cp && cp. length === 5) {
      const prefix = cp.substring(0, 2);
      const provincia = this.provinciasMap[prefix] || 'Desconocida';
      this.optica. patchValue({ provincia });
    } else {
      this.optica.patchValue({ provincia: '' });
    }
  }

  onsubmit(): void {
    this.formSubmitted = true;

    if (this.optica. invalid) {
      this.showErrorsModal();
      return;
    }

    this.showDataModal();
  }

  showErrorsModal(): void {
    const errors:  string[] = [];

    Object.keys(this.optica. controls).forEach(key => {
      const control = this.optica.get(key);
      if (control && control.invalid) {
        errors.push(this.getErrorMessage(key, control));
      }
    });

    const modalErrorsList = document.getElementById('modalErrorsList');
    if (modalErrorsList) {
      modalErrorsList.innerHTML = '<ul class="list-unstyled mb-0">' +
        errors.map(err => `<li>• ${err}</li>`).join('') +
        '</ul>';
    }

    const modal = document.getElementById('errorsModal');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  getErrorMessage(fieldName: string, control: AbstractControl): string {
    const fieldLabels:  { [key: string]: string } = {
      nombre: 'Nombre',
      email: 'Email',
      telefono: 'Teléfono',
      cp: 'Código Postal',
      tipo: 'Tipo',
      fecha: 'Fecha deseada',
      checkbox: 'Aceptar condiciones'
    };

    const label = fieldLabels[fieldName] || fieldName;

    if (control.errors?. ['required'] || control.errors?.['requiredTrue']) {
      return `${label} es obligatorio`;
    }
    if (control.errors?.['minLength']) {
      return `${label} debe tener al menos ${control.errors['minLength'].requiredLength} caracteres`;
    }
    if (control.errors?.['invalidEmail']) {
      return `${label} no tiene un formato válido`;
    }
    if (control.errors?. ['invalidTelefono']) {
      return `${label} debe empezar por 6, 7 o 9 y tener 9 dígitos`;
    }
    if (control.errors?. ['invalidCP']) {
      return `${label} debe tener 5 dígitos`;
    }
    if (control.errors?.['invalidFormat']) {
      return `${label} debe tener el formato dd/mm/aaaa`;
    }
    if (control.errors?.['invalidDate']) {
      return `${label} no es una fecha válida`;
    }
    if (control.errors?.['pastDate']) {
      return `${label} no puede ser una fecha pasada`;
    }

    return `${label} tiene un error`;
  }

  showDataModal(): void {
    const formData = this.optica.getRawValue();

    const dataHtml = `
      <dl class="row mb-0">
        <dt class="col-sm-4">Nombre:</dt>
        <dd class="col-sm-8">${formData.nombre}</dd>

        <dt class="col-sm-4">Email:</dt>
        <dd class="col-sm-8">${formData.email}</dd>

        <dt class="col-sm-4">Teléfono:</dt>
        <dd class="col-sm-8">${formData.telefono || 'No especificado'}</dd>

        <dt class="col-sm-4">Código Postal:</dt>
        <dd class="col-sm-8">${formData.cp}</dd>

        <dt class="col-sm-4">Provincia:</dt>
        <dd class="col-sm-8">${formData.provincia}</dd>

        <dt class="col-sm-4">Tipo:</dt>
        <dd class="col-sm-8">${formData.tipo}</dd>

        <dt class="col-sm-4">Dolencias:</dt>
        <dd class="col-sm-8">${formData.dolencias. length > 0 ? formData. dolencias.join(', ') : 'Ninguna'}</dd>

        <dt class="col-sm-4">Fecha deseada:</dt>
        <dd class="col-sm-8">${formData.fecha}</dd>

        <dt class="col-sm-4">Comentarios:</dt>
        <dd class="col-sm-8">${formData.comentario || 'Sin comentarios'}</dd>
      </dl>
    `;

    const modalDataBody = document.getElementById('modalDataBody');
    if (modalDataBody) {
      modalDataBody.innerHTML = dataHtml;
    }

    const modal = document.getElementById('dataModal');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }
}
