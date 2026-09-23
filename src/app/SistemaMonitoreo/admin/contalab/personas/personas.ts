import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Service and Type isolation
import { PersonasService } from '../../../../services/personas.service';
import { RolesType } from '../../../../services/users.service';
import type {
    CreatePersona,
    UpdatePersona,
    PersonasResponse
} from '../../../../services/personas.service';


import {
    PHONE_INPUT_PLACEHOLDER,
    PHONE_COUNTRY_SELECT_PLACEHOLDER,
    PHONE_COUNTRY_WIDTH,
    PHONE_NUMBER_MAX_LENGTH
} from './personas.ui';


import type { PersonaFilter } from './personas.filter';

// Combined Material Table imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { DynamicCreateModel } from '../../helpers/ActionsHelper';

import { InitializeTableSchema, HIDDEN_COLUMNS } from './personas.schema';
import { InitializeFilterEngine } from './personas.filter';

import { InitializeDefaultValues } from '../../helpers/FormInit';
import { AuthService } from '../../../../services/auth.service';

type UpdateModalAction = 'close' | 'reset';
type PersonaFilterKey = keyof PersonaFilter;
type CreateMode = 'menu' | 'single' | 'multi' | 'import';

/**
 * Información necesaria para construir un número telefónico.
 */
export interface PhoneCountry {
    code: string;
    country: string;
    flag: string;
    digits: number;
    format?: string;
}

/**
 * Países disponibles para los teléfonos de las personas.
 *
 * `digits` representa la cantidad de dígitos nacionales
 * que se esperan después del código internacional.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
    {
        code: '+1',
        country: 'Estados Unidos',
        flag: 'US',
        digits: 10
    },
    {
        code: '+1',
        country: 'Canadá',
        flag: 'CA',
        digits: 10
    },
    {
        code: '+7',
        country: 'Rusia',
        flag: 'RU',
        digits: 10
    },
    {
        code: '+20',
        country: 'Egipto',
        flag: 'EG',
        digits: 10
    },
    {
        code: '+27',
        country: 'Sudáfrica',
        flag: 'ZA',
        digits: 9
    },
    {
        code: '+30',
        country: 'Grecia',
        flag: 'GR',
        digits: 10
    },
    {
        code: '+31',
        country: 'Países Bajos',
        flag: 'NL',
        digits: 9
    },
    {
        code: '+32',
        country: 'Bélgica',
        flag: 'BE',
        digits: 9
    },
    {
        code: '+33',
        country: 'Francia',
        flag: 'FR',
        digits: 9
    },
    {
        code: '+34',
        country: 'España',
        flag: 'ES',
        digits: 9
    },
    {
        code: '+36',
        country: 'Hungría',
        flag: 'HU',
        digits: 9
    },
    {
        code: '+39',
        country: 'Italia',
        flag: 'IT',
        digits: 10
    },
    {
        code: '+40',
        country: 'Rumanía',
        flag: 'RO',
        digits: 9
    },
    {
        code: '+41',
        country: 'Suiza',
        flag: 'CH',
        digits: 9
    },
    {
        code: '+43',
        country: 'Austria',
        flag: 'AT',
        digits: 10
    },
    {
        code: '+44',
        country: 'Reino Unido',
        flag: 'GB',
        digits: 10
    },
    {
        code: '+45',
        country: 'Dinamarca',
        flag: 'DK',
        digits: 8
    },
    {
        code: '+46',
        country: 'Suecia',
        flag: 'SE',
        digits: 9
    },
    {
        code: '+47',
        country: 'Noruega',
        flag: 'NO',
        digits: 8
    },
    {
        code: '+48',
        country: 'Polonia',
        flag: 'PL',
        digits: 9
    },
    {
        code: '+49',
        country: 'Alemania',
        flag: 'DE',
        digits: 10
    },
    {
        code: '+51',
        country: 'Perú',
        flag: 'PE',
        digits: 9
    },
    {
        code: '+52',
        country: 'México',
        flag: 'MX',
        digits: 10
    },
    {
        code: '+53',
        country: 'Cuba',
        flag: 'CU',
        digits: 8
    },
    {
        code: '+54',
        country: 'Argentina',
        flag: 'AR',
        digits: 10
    },
    {
        code: '+55',
        country: 'Brasil',
        flag: 'BR',
        digits: 11
    },
    {
        code: '+56',
        country: 'Chile',
        flag: 'CL',
        digits: 9
    },
    {
        code: '+57',
        country: 'Colombia',
        flag: 'CO',
        digits: 10
    },
    {
        code: '+58',
        country: 'Venezuela',
        flag: 'VE',
        digits: 10
    },
    {
        code: '+60',
        country: 'Malasia',
        flag: 'MY',
        digits: 9
    },
    {
        code: '+61',
        country: 'Australia',
        flag: 'AU',
        digits: 9
    },
    {
        code: '+62',
        country: 'Indonesia',
        flag: 'ID',
        digits: 10
    },
    {
        code: '+63',
        country: 'Filipinas',
        flag: 'PH',
        digits: 10
    },
    {
        code: '+64',
        country: 'Nueva Zelanda',
        flag: 'NZ',
        digits: 9
    },
    {
        code: '+65',
        country: 'Singapur',
        flag: 'SG',
        digits: 8
    },
    {
        code: '+66',
        country: 'Tailandia',
        flag: 'TH',
        digits: 9
    },
    {
        code: '+81',
        country: 'Japón',
        flag: 'JP',
        digits: 10
    },
    {
        code: '+82',
        country: 'Corea del Sur',
        flag: 'KR',
        digits: 10
    },
    {
        code: '+84',
        country: 'Vietnam',
        flag: 'VN',
        digits: 9
    },
    {
        code: '+86',
        country: 'China',
        flag: 'CN',
        digits: 11
    },
    {
        code: '+90',
        country: 'Turquía',
        flag: 'TR',
        digits: 10
    },
    {
        code: '+91',
        country: 'India',
        flag: 'IN',
        digits: 10
    },
    {
        code: '+92',
        country: 'Pakistán',
        flag: 'PK',
        digits: 10
    },
    {
        code: '+93',
        country: 'Afganistán',
        flag: 'AF',
        digits: 9
    },
    {
        code: '+94',
        country: 'Sri Lanka',
        flag: 'LK',
        digits: 9
    },
    {
        code: '+95',
        country: 'Myanmar',
        flag: 'MM',
        digits: 9
    },
    {
        code: '+98',
        country: 'Irán',
        flag: 'IR',
        digits: 10
    },
    {
        code: '+212',
        country: 'Marruecos',
        flag: 'MA',
        digits: 9
    },
    {
        code: '+213',
        country: 'Argelia',
        flag: 'DZ',
        digits: 9
    },
    {
        code: '+216',
        country: 'Túnez',
        flag: 'TN',
        digits: 8
    },
    {
        code: '+218',
        country: 'Libia',
        flag: 'LY',
        digits: 9
    },
    {
        code: '+220',
        country: 'Gambia',
        flag: 'GM',
        digits: 7
    },
    {
        code: '+221',
        country: 'Senegal',
        flag: 'SN',
        digits: 9
    },
    {
        code: '+222',
        country: 'Mauritania',
        flag: 'MR',
        digits: 8
    },
    {
        code: '+223',
        country: 'Malí',
        flag: 'ML',
        digits: 8
    },
    {
        code: '+224',
        country: 'Guinea',
        flag: 'GN',
        digits: 9
    },
    {
        code: '+225',
        country: 'Costa de Marfil',
        flag: 'CI',
        digits: 10
    },
    {
        code: '+226',
        country: 'Burkina Faso',
        flag: 'BF',
        digits: 8
    },
    {
        code: '+227',
        country: 'Níger',
        flag: 'NE',
        digits: 8
    },
    {
        code: '+228',
        country: 'Togo',
        flag: 'TG',
        digits: 8
    },
    {
        code: '+229',
        country: 'Benín',
        flag: 'BJ',
        digits: 8
    },
    {
        code: '+230',
        country: 'Mauricio',
        flag: 'MU',
        digits: 8
    },
    {
        code: '+231',
        country: 'Liberia',
        flag: 'LR',
        digits: 7
    },
    {
        code: '+232',
        country: 'Sierra Leona',
        flag: 'SL',
        digits: 8
    },
    {
        code: '+233',
        country: 'Ghana',
        flag: 'GH',
        digits: 9
    },
    {
        code: '+234',
        country: 'Nigeria',
        flag: 'NG',
        digits: 10
    },
    {
        code: '+235',
        country: 'Chad',
        flag: 'TD',
        digits: 8
    },
    {
        code: '+236',
        country: 'República Centroafricana',
        flag: 'CF',
        digits: 8
    },
    {
        code: '+237',
        country: 'Camerún',
        flag: 'CM',
        digits: 9
    },
    {
        code: '+238',
        country: 'Cabo Verde',
        flag: 'CV',
        digits: 7
    },
    {
        code: '+239',
        country: 'Santo Tomé y Príncipe',
        flag: 'ST',
        digits: 7
    },
    {
        code: '+240',
        country: 'Guinea Ecuatorial',
        flag: 'GQ',
        digits: 9
    },
    {
        code: '+241',
        country: 'Gabón',
        flag: 'GA',
        digits: 7
    },
    {
        code: '+242',
        country: 'República del Congo',
        flag: 'CG',
        digits: 9
    },
    {
        code: '+243',
        country: 'República Democrática del Congo',
        flag: 'CD',
        digits: 9
    },
    {
        code: '+244',
        country: 'Angola',
        flag: 'AO',
        digits: 9
    },
    {
        code: '+245',
        country: 'Guinea-Bisáu',
        flag: 'GW',
        digits: 7
    },
    {
        code: '+246',
        country: 'Territorio Británico del Océano Índico',
        flag: 'IO',
        digits: 7
    },
    {
        code: '+248',
        country: 'Seychelles',
        flag: 'SC',
        digits: 7
    },
    {
        code: '+249',
        country: 'Sudán',
        flag: 'SD',
        digits: 9
    },
    {
        code: '+250',
        country: 'Ruanda',
        flag: 'RW',
        digits: 9
    },
    {
        code: '+251',
        country: 'Etiopía',
        flag: 'ET',
        digits: 9
    },
    {
        code: '+252',
        country: 'Somalia',
        flag: 'SO',
        digits: 8
    },
    {
        code: '+253',
        country: 'Yibuti',
        flag: 'DJ',
        digits: 8
    },
    {
        code: '+254',
        country: 'Kenia',
        flag: 'KE',
        digits: 9
    },
    {
        code: '+255',
        country: 'Tanzania',
        flag: 'TZ',
        digits: 9
    },
    {
        code: '+256',
        country: 'Uganda',
        flag: 'UG',
        digits: 9
    },
    {
        code: '+257',
        country: 'Burundi',
        flag: 'BI',
        digits: 8
    },
    {
        code: '+258',
        country: 'Mozambique',
        flag: 'MZ',
        digits: 9
    },
    {
        code: '+260',
        country: 'Zambia',
        flag: 'ZM',
        digits: 9
    },
    {
        code: '+261',
        country: 'Madagascar',
        flag: 'MG',
        digits: 9
    },
    {
        code: '+262',
        country: 'Reunión',
        flag: 'RE',
        digits: 9
    },
    {
        code: '+263',
        country: 'Zimbabue',
        flag: 'ZW',
        digits: 9
    },
    {
        code: '+264',
        country: 'Namibia',
        flag: 'NA',
        digits: 9
    },
    {
        code: '+265',
        country: 'Malaui',
        flag: 'MW',
        digits: 9
    },
    {
        code: '+266',
        country: 'Lesoto',
        flag: 'LS',
        digits: 8
    },
    {
        code: '+267',
        country: 'Botsuana',
        flag: 'BW',
        digits: 8
    },
    {
        code: '+268',
        country: 'Esuatini',
        flag: 'SZ',
        digits: 8
    },
    {
        code: '+269',
        country: 'Comoras',
        flag: 'KM',
        digits: 7
    },
    {
        code: '+290',
        country: 'Santa Elena',
        flag: 'SH',
        digits: 4
    },
    {
        code: '+291',
        country: 'Eritrea',
        flag: 'ER',
        digits: 7
    },
    {
        code: '+297',
        country: 'Aruba',
        flag: 'AW',
        digits: 7
    },
    {
        code: '+298',
        country: 'Islas Feroe',
        flag: 'FO',
        digits: 6
    },
    {
        code: '+299',
        country: 'Groenlandia',
        flag: 'GL',
        digits: 6
    },
    {
        code: '+350',
        country: 'Gibraltar',
        flag: 'GI',
        digits: 8
    },
    {
        code: '+351',
        country: 'Portugal',
        flag: 'PT',
        digits: 9
    },
    {
        code: '+352',
        country: 'Luxemburgo',
        flag: 'LU',
        digits: 9
    },
    {
        code: '+353',
        country: 'Irlanda',
        flag: 'IE',
        digits: 9
    },
    {
        code: '+354',
        country: 'Islandia',
        flag: 'IS',
        digits: 7
    },
    {
        code: '+355',
        country: 'Albania',
        flag: 'AL',
        digits: 9
    },
    {
        code: '+356',
        country: 'Malta',
        flag: 'MT',
        digits: 8
    },
    {
        code: '+357',
        country: 'Chipre',
        flag: 'CY',
        digits: 8
    },
    {
        code: '+358',
        country: 'Finlandia',
        flag: 'FI',
        digits: 9
    },
    {
        code: '+359',
        country: 'Bulgaria',
        flag: 'BG',
        digits: 9
    },
    {
        code: '+370',
        country: 'Lituania',
        flag: 'LT',
        digits: 8
    },
    {
        code: '+371',
        country: 'Letonia',
        flag: 'LV',
        digits: 8
    },
    {
        code: '+372',
        country: 'Estonia',
        flag: 'EE',
        digits: 7
    },
    {
        code: '+373',
        country: 'Moldavia',
        flag: 'MD',
        digits: 8
    },
    {
        code: '+374',
        country: 'Armenia',
        flag: 'AM',
        digits: 8
    },
    {
        code: '+375',
        country: 'Bielorrusia',
        flag: 'BY',
        digits: 9
    },
    {
        code: '+376',
        country: 'Andorra',
        flag: 'AD',
        digits: 6
    },
    {
        code: '+377',
        country: 'Mónaco',
        flag: 'MC',
        digits: 8
    },
    {
        code: '+378',
        country: 'San Marino',
        flag: 'SM',
        digits: 10
    },
    {
        code: '+380',
        country: 'Ucrania',
        flag: 'UA',
        digits: 9
    },
    {
        code: '+381',
        country: 'Serbia',
        flag: 'RS',
        digits: 9
    },
    {
        code: '+382',
        country: 'Montenegro',
        flag: 'ME',
        digits: 8
    },
    {
        code: '+383',
        country: 'Kosovo',
        flag: 'XK',
        digits: 8
    },
    {
        code: '+385',
        country: 'Croacia',
        flag: 'HR',
        digits: 9
    },
    {
        code: '+386',
        country: 'Eslovenia',
        flag: 'SI',
        digits: 8
    },
    {
        code: '+387',
        country: 'Bosnia y Herzegovina',
        flag: 'BA',
        digits: 8
    },
    {
        code: '+389',
        country: 'Macedonia del Norte',
        flag: 'MK',
        digits: 8
    },
    {
        code: '+420',
        country: 'República Checa',
        flag: 'CZ',
        digits: 9
    },
    {
        code: '+421',
        country: 'Eslovaquia',
        flag: 'SK',
        digits: 9
    },
    {
        code: '+423',
        country: 'Liechtenstein',
        flag: 'LI',
        digits: 7
    },
    {
        code: '+500',
        country: 'Islas Malvinas',
        flag: 'FK',
        digits: 5
    },
    {
        code: '+501',
        country: 'Belice',
        flag: 'BZ',
        digits: 7
    },
    {
        code: '+502',
        country: 'Guatemala',
        flag: 'GT',
        digits: 8
    },
    {
        code: '+503',
        country: 'El Salvador',
        flag: 'SV',
        digits: 8
    },
    {
        code: '+504',
        country: 'Honduras',
        flag: 'HN',
        digits: 8
    },
    {
        code: '+505',
        country: 'Nicaragua',
        flag: 'NI',
        digits: 8
    },
    {
        code: '+506',
        country: 'Costa Rica',
        flag: 'CR',
        digits: 8
    },
    {
        code: '+507',
        country: 'Panamá',
        flag: 'PA',
        digits: 7
    },
    {
        code: '+508',
        country: 'San Pedro y Miquelón',
        flag: 'PM',
        digits: 6
    },
    {
        code: '+509',
        country: 'Haití',
        flag: 'HT',
        digits: 8
    },
    {
        code: '+590',
        country: 'Guadalupe',
        flag: 'GP',
        digits: 9
    },
    {
        code: '+591',
        country: 'Bolivia',
        flag: 'BO',
        digits: 8
    },
    {
        code: '+592',
        country: 'Guyana',
        flag: 'GY',
        digits: 7
    },
    {
        code: '+593',
        country: 'Ecuador',
        flag: 'EC',
        digits: 9
    },
    {
        code: '+594',
        country: 'Guayana Francesa',
        flag: 'GF',
        digits: 9
    },
    {
        code: '+595',
        country: 'Paraguay',
        flag: 'PY',
        digits: 9
    },
    {
        code: '+596',
        country: 'Martinica',
        flag: 'MQ',
        digits: 9
    },
    {
        code: '+597',
        country: 'Surinam',
        flag: 'SR',
        digits: 7
    },
    {
        code: '+598',
        country: 'Uruguay',
        flag: 'UY',
        digits: 8
    },
    {
        code: '+599',
        country: 'Curazao',
        flag: 'CW',
        digits: 7
    },
    {
        code: '+670',
        country: 'Timor Oriental',
        flag: 'TL',
        digits: 8
    },
    {
        code: '+672',
        country: 'Territorios Australianos',
        flag: 'AU',
        digits: 9
    },
    {
        code: '+673',
        country: 'Brunéi',
        flag: 'BN',
        digits: 7
    },
    {
        code: '+674',
        country: 'Nauru',
        flag: 'NR',
        digits: 7
    },
    {
        code: '+675',
        country: 'Papúa Nueva Guinea',
        flag: 'PG',
        digits: 8
    },
    {
        code: '+676',
        country: 'Tonga',
        flag: 'TO',
        digits: 7
    },
    {
        code: '+677',
        country: 'Islas Salomón',
        flag: 'SB',
        digits: 7
    },
    {
        code: '+678',
        country: 'Vanuatu',
        flag: 'VU',
        digits: 7
    },
    {
        code: '+679',
        country: 'Fiyi',
        flag: 'FJ',
        digits: 7
    },
    {
        code: '+680',
        country: 'Palaos',
        flag: 'PW',
        digits: 7
    },
    {
        code: '+681',
        country: 'Wallis y Futuna',
        flag: 'WF',
        digits: 6
    },
    {
        code: '+682',
        country: 'Islas Cook',
        flag: 'CK',
        digits: 5
    },
    {
        code: '+683',
        country: 'Niue',
        flag: 'NU',
        digits: 4
    },
    {
        code: '+685',
        country: 'Samoa',
        flag: 'WS',
        digits: 7
    },
    {
        code: '+686',
        country: 'Kiribati',
        flag: 'KI',
        digits: 8
    },
    {
        code: '+687',
        country: 'Nueva Caledonia',
        flag: 'NC',
        digits: 6
    },
    {
        code: '+688',
        country: 'Tuvalu',
        flag: 'TV',
        digits: 5
    },
    {
        code: '+689',
        country: 'Polinesia Francesa',
        flag: 'PF',
        digits: 8
    },
    {
        code: '+690',
        country: 'Tokelau',
        flag: 'TK',
        digits: 4
    },
    {
        code: '+691',
        country: 'Micronesia',
        flag: 'FM',
        digits: 7
    },
    {
        code: '+692',
        country: 'Islas Marshall',
        flag: 'MH',
        digits: 7
    },
    {
        code: '+850',
        country: 'Corea del Norte',
        flag: 'KP',
        digits: 10
    },
    {
        code: '+852',
        country: 'Hong Kong',
        flag: 'HK',
        digits: 8
    },
    {
        code: '+853',
        country: 'Macao',
        flag: 'MO',
        digits: 8
    },
    {
        code: '+855',
        country: 'Camboya',
        flag: 'KH',
        digits: 9
    },
    {
        code: '+856',
        country: 'Laos',
        flag: 'LA',
        digits: 9
    },
    {
        code: '+880',
        country: 'Bangladés',
        flag: 'BD',
        digits: 10
    },
    {
        code: '+886',
        country: 'Taiwán',
        flag: 'TW',
        digits: 9
    },
    {
        code: '+960',
        country: 'Maldivas',
        flag: 'MV',
        digits: 7
    },
    {
        code: '+961',
        country: 'Líbano',
        flag: 'LB',
        digits: 7
    },
    {
        code: '+962',
        country: 'Jordania',
        flag: 'JO',
        digits: 9
    },
    {
        code: '+963',
        country: 'Siria',
        flag: 'SY',
        digits: 9
    },
    {
        code: '+964',
        country: 'Irak',
        flag: 'IQ',
        digits: 10
    },
    {
        code: '+965',
        country: 'Kuwait',
        flag: 'KW',
        digits: 8
    },
    {
        code: '+966',
        country: 'Arabia Saudita',
        flag: 'SA',
        digits: 9
    },
    {
        code: '+967',
        country: 'Yemen',
        flag: 'YE',
        digits: 9
    },
    {
        code: '+968',
        country: 'Omán',
        flag: 'OM',
        digits: 8
    },
    {
        code: '+970',
        country: 'Palestina',
        flag: 'PS',
        digits: 9
    },
    {
        code: '+971',
        country: 'Emiratos Árabes Unidos',
        flag: 'AE',
        digits: 9
    },
    {
        code: '+972',
        country: 'Israel',
        flag: 'IL',
        digits: 9
    },
    {
        code: '+973',
        country: 'Baréin',
        flag: 'BH',
        digits: 8
    },
    {
        code: '+974',
        country: 'Catar',
        flag: 'QA',
        digits: 8
    },
    {
        code: '+975',
        country: 'Bután',
        flag: 'BT',
        digits: 8
    },
    {
        code: '+976',
        country: 'Mongolia',
        flag: 'MN',
        digits: 8
    },
    {
        code: '+977',
        country: 'Nepal',
        flag: 'NP',
        digits: 10
    },
    {
        code: '+992',
        country: 'Tayikistán',
        flag: 'TJ',
        digits: 9
    },
    {
        code: '+993',
        country: 'Turkmenistán',
        flag: 'TM',
        digits: 8
    },
    {
        code: '+994',
        country: 'Azerbaiyán',
        flag: 'AZ',
        digits: 9
    },
    {
        code: '+995',
        country: 'Georgia',
        flag: 'GE',
        digits: 9
    },
    {
        code: '+996',
        country: 'Kirguistán',
        flag: 'KG',
        digits: 9
    },
    {
        code: '+998',
        country: 'Uzbekistán',
        flag: 'UZ',
        digits: 9
    }
];

@Component({
    selector: 'app-personas',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './personas.html',
    styleUrl: './personas.css',
})
export class Personas {

    readonly PHONE_INPUT_PLACEHOLDER = PHONE_INPUT_PLACEHOLDER;
    readonly PHONE_COUNTRY_SELECT_PLACEHOLDER = PHONE_COUNTRY_SELECT_PLACEHOLDER;
    readonly PHONE_COUNTRY_WIDTH = PHONE_COUNTRY_WIDTH;
    readonly PHONE_NUMBER_MAX_LENGTH = PHONE_NUMBER_MAX_LENGTH;

    /**
     * Convierte un código ISO-3166 alpha-2 (ej. 'NI') en el emoji de
     * bandera correspondiente, usando Regional Indicator Symbols.
     *
     * Es una conversión Unicode pura: no se agrega ninguna librería
     * ni se escriben emojis literales en el código. Se eligió esta
     * opción porque Angular Material no trae assets de banderas y
     * agregar una librería de íconos de países solo para esto sería
     * una dependencia innecesaria para lo que pides.
     */
    isoToFlagEmoji(iso: string | null | undefined): string {

        if (!iso || iso.length !== 2) {
            return '🏳️';
        }

        return [...iso.toUpperCase()]
            .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
            .join('');
    }

    /**
     * Bandera a partir de un código telefónico (dial code), para
     * los lugares donde solo tienes el número ya guardado (tabla
     * principal). Cuando el dial code es compartido (+1 EE.UU./Canadá)
     * devuelve la bandera del primer país que coincide en
     * PHONE_COUNTRIES — limitación heredada del modelo de datos,
     * no introducida por este cambio.
     */
    getPhoneFlagEmoji(code: string | null | undefined): string {
        return this.isoToFlagEmoji(this.getPhoneFlag(code));
    }

    /**
     * Limpia los espacios visuales antes de enviar al backend,
     * conservando el prefijo y los dígitos.
     *
     * "+505 8888 8888" -> "+50588888888"
     *
     */
    toBackendPhone(value: string | null | undefined): string {

        if (!value) {
            return '';
        }

        // return value.replace(/\s+/g, '');
        return value;
    }

    // =========================================================
    // CONSTRUCTOR / INIT
    // =========================================================

    constructor(
        private readonly personasService: PersonasService,
        private readonly authService: AuthService
    ) {
        this.loadData();
    }

    // =========================================================
    // PHONE
    // =========================================================

    /**
     * Lista de países disponible para el mat-select.
     *
     * Se expone como propiedad pública para que personas.html
     * pueda utilizarla directamente.
     */
    readonly phoneCountries = PHONE_COUNTRIES;

    /**
     * País predeterminado.
     *
     * Nicaragua se utiliza como valor inicial porque el formato
     * esperado para el sistema es +505 XXXXXXXX.
     */
    readonly defaultPhoneCountryCode = '+505';

    /**
     * País seleccionado actualmente para el formulario de creación.
     */
    createPhoneCountry = this.getPhoneCountry(this.defaultPhoneCountryCode);

    /**
     * País seleccionado actualmente para el formulario de actualización.
     */
    updatePhoneCountry = this.getPhoneCountry(this.defaultPhoneCountryCode);

    /**
     * Países seleccionados para las filas de creación múltiple.
     *
     * La clave corresponde al índice de la fila.
     */
    multiPhoneCountries: Record<number, string> = {};

    /**
     * Obtiene un país a partir de su código telefónico.
     */
    getPhoneCountry(code: string | null | undefined): PhoneCountry {

        if (!code) {
            return PHONE_COUNTRIES.find(
                country => country.code === this.defaultPhoneCountryCode
            ) ?? PHONE_COUNTRIES[0];
        }

        return PHONE_COUNTRIES.find(
            country => country.code === code
        ) ?? (
                PHONE_COUNTRIES.find(
                    country => country.code === this.defaultPhoneCountryCode
                ) ?? PHONE_COUNTRIES[0]
            );
    }

    /**
     * Obtiene la bandera utilizando el código ISO.
     *
     * Se deja como texto ISO para que el HTML pueda decidir
     * cómo representarla visualmente.
     */
    getPhoneFlag(code: string | null | undefined): string {

        return this.getPhoneCountry(code).flag;
    }

    /**
     * Obtiene el nombre del país.
     */
    getPhoneCountryName(
        code: string | null | undefined
    ): string {

        return this.getPhoneCountry(code).country;
    }

    /**
     * Cambia el país telefónico del formulario de creación.
     *
     * Conserva únicamente los dígitos del número y vuelve a
     * construir el número completo con el nuevo prefijo.
     */
    onCreatePhoneCountryChange(
        countryCode: string
    ) {

        this.createPhoneCountry =
            this.getPhoneCountry(countryCode);

        const current =
            this.formCreateState['telefono'] ?? '';

        const national =
            this.extractNationalPhone(current);

        this.formCreateState = {
            ...this.formCreateState,
            telefono: this.formatPhoneNumber(
                countryCode,
                national
            )
        };

        this.updateFormValidity('create');
        this.updateDirtyState();
    }

    /**
     * Cambia el país telefónico del formulario de actualización.
     */
    onUpdatePhoneCountryChange(
        countryCode: string
    ) {

        this.updatePhoneCountry =
            this.getPhoneCountry(countryCode);

        const current =
            this.formUpdateState['telefono'] ?? '';

        const national =
            this.extractNationalPhone(current);

        this.formUpdateState = {
            ...this.formUpdateState,
            telefono: this.formatPhoneNumber(
                countryCode,
                national
            )
        };

        this.updateDirtyState();
        this.updateFormValidity('update');
    }

    /**
     * Cambia el país de una fila del modo múltiple.
     */
    onMultiPhoneCountryChange(
        rowIndex: number,
        countryCode: string
    ) {

        this.multiPhoneCountries = {
            ...this.multiPhoneCountries,
            [rowIndex]: countryCode
        };

        const rows = this.multiRows();

        if (!rows[rowIndex]) {
            return;
        }

        const national =
            this.extractNationalPhone(
                rows[rowIndex]['telefono']
            );

        rows[rowIndex] = {
            ...rows[rowIndex],
            telefono: this.formatPhoneNumber(
                countryCode,
                national
            )
        };

        this.multiRows.set([...rows]);
    }

    /**
     * Obtiene el país seleccionado de una fila.
     */
    getMultiPhoneCountry(rowIndex: number): string {

        return this.multiPhoneCountries[rowIndex]
            ?? this.defaultPhoneCountryCode;
    }

    /**
     * Maneja la escritura del teléfono en creación.
     */
    onCreatePhoneInput(
        event: Event
    ) {

        const input =
            event.target as HTMLInputElement;

        const country =
            this.createPhoneCountry;

        const digits =
            this.extractNationalPhone(input.value);

        const limited =
            digits.slice(0, country.digits);

        const formatted =
            this.formatPhoneNumber(
                country.code,
                limited
            );

        this.formCreateState = {
            ...this.formCreateState,
            telefono: formatted
        };

        input.value = formatted;

        this.updateFormValidity('create');
        this.updateDirtyState();
    }

    /**
     * Maneja la escritura del teléfono en actualización.
     */
    onUpdatePhoneInput(
        event: Event
    ) {

        const input =
            event.target as HTMLInputElement;

        const country =
            this.updatePhoneCountry;

        const digits =
            this.extractNationalPhone(input.value);

        const limited =
            digits.slice(0, country.digits);

        const formatted =
            this.formatPhoneNumber(
                country.code,
                limited
            );

        this.formUpdateState = {
            ...this.formUpdateState,
            telefono: formatted
        };

        input.value = formatted;

        this.updateDirtyState();
        this.updateFormValidity('update');
    }

    /**
     * Maneja la escritura del teléfono de una fila múltiple.
     */
    onMultiPhoneInput(
        rowIndex: number,
        event: Event
    ) {

        const input =
            event.target as HTMLInputElement;

        const countryCode =
            this.getMultiPhoneCountry(rowIndex);

        const country =
            this.getPhoneCountry(countryCode);

        const digits =
            this.extractNationalPhone(input.value);

        const limited =
            digits.slice(0, country.digits);

        const formatted =
            this.formatPhoneNumber(
                country.code,
                limited
            );

        this.updateCell(
            rowIndex,
            'telefono',
            formatted
        );

        input.value = formatted;
    }

    /**
     * Normaliza un teléfono recibido desde la API.
     *
     * Ejemplos:
     *
     * +505 2821 1823
     * +50528211823
     * 28211823
     */
    normalizePhoneNumber(
        value: string | null | undefined
    ): string {

        if (!value) {
            return '';
        }

        const clean =
            value
                .trim()
                .replace(/[^\d+]/g, '');

        if (!clean) {
            return '';
        }

        const country =
            this.findPhoneCountryFromNumber(clean);

        if (!country) {
            return value.trim();
        }

        const national =
            this.extractNationalPhone(clean);

        return this.formatPhoneNumber(
            country.code,
            national
        );
    }

    /**
     * Obtiene el código de país de un teléfono completo.
     */
    getPhoneCodeFromNumber(
        value: string | null | undefined
    ): string {

        if (!value) {
            return this.defaultPhoneCountryCode;
        }

        const country =
            this.findPhoneCountryFromNumber(value);

        return country?.code
            ?? this.defaultPhoneCountryCode;
    }

    /**
     * Busca el país correspondiente a un teléfono.
     *
     * Los códigos de 3 dígitos se evalúan antes que los de
     * 1 y 2 dígitos para evitar coincidencias parciales.
     */
    private findPhoneCountryFromNumber(
        value: string
    ): PhoneCountry | undefined {

        const digits =
            this.onlyDigits(value);

        return [...PHONE_COUNTRIES]
            .sort(
                (a, b) =>
                    b.code.length - a.code.length
            )
            .find(country =>
                digits.startsWith(
                    this.onlyDigits(country.code)
                )
            );
    }

    /**
     * Extrae solamente la parte nacional del teléfono.
     */
    extractNationalPhone(
        value: string | null | undefined
    ): string {

        if (!value) {
            return '';
        }

        const digits =
            this.onlyDigits(value);

        if (!digits) {
            return '';
        }

        const country =
            this.findPhoneCountryFromNumber(value);

        if (!country) {
            return digits;
        }

        const prefix =
            this.onlyDigits(country.code);

        if (digits.startsWith(prefix)) {
            return digits.slice(prefix.length);
        }

        return digits;
    }

    /**
     * Conserva solamente dígitos.
     */
    onlyDigits(
        value: string | null | undefined
    ): string {

        return String(value ?? '')
            .replace(/\D/g, '');
    }

    /**
     * Formatea el teléfono.
     *
     * Para Nicaragua:
     * +505 2821 1823
     *
     * Para países con 10 dígitos:
     * +1 202 555 0123
     */
    formatPhoneNumber(
        countryCode: string,
        nationalNumber: string
    ): string {

        const country =
            this.getPhoneCountry(countryCode);

        let digits =
            this.onlyDigits(nationalNumber);

        digits =
            digits.slice(0, country.digits);

        if (!digits) {
            return country.code;
        }

        const groups =
            this.getPhoneGroups(
                country,
                digits
            );

        return [
            country.code,
            ...groups
        ].join(' ');
    }

    /**
     * Define grupos visuales razonables para los números.
     *
     * Nicaragua queda explícitamente como:
     * XXXX XXXX
     */
    private getPhoneGroups(
        country: PhoneCountry,
        digits: string
    ): string[] {

        if (country.code === '+505') {
            return this.groupDigits(
                digits,
                [4, 4]
            );
        }

        if (
            country.code === '+502' ||
            country.code === '+503' ||
            country.code === '+504' ||
            country.code === '+506' ||
            country.code === '+509'
        ) {
            return this.groupDigits(
                digits,
                [4, 4]
            );
        }

        if (
            country.code === '+507' ||
            country.code === '+591' ||
            country.code === '+592' ||
            country.code === '+595' ||
            country.code === '+598'
        ) {
            return this.groupDigits(
                digits,
                [3, 4]
            );
        }

        if (
            country.code === '+52' ||
            country.code === '+54' ||
            country.code === '+55' ||
            country.code === '+57'
        ) {
            return this.groupDigits(
                digits,
                [3, 3, 4]
            );
        }

        if (
            country.code === '+1'
        ) {
            return this.groupDigits(
                digits,
                [3, 3, 4]
            );
        }

        if (country.digits === 8) {
            return this.groupDigits(
                digits,
                [4, 4]
            );
        }

        if (country.digits === 9) {
            return this.groupDigits(
                digits,
                [3, 3, 3]
            );
        }

        if (country.digits === 10) {
            return this.groupDigits(
                digits,
                [3, 3, 4]
            );
        }

        if (country.digits === 11) {
            return this.groupDigits(
                digits,
                [3, 4, 4]
            );
        }

        return this.groupDigits(
            digits,
            [3, 4, 4]
        );
    }

    /**
     * Divide un número en grupos sin perder los dígitos
     * introducidos cuando todavía está incompleto.
     */
    private groupDigits(
        digits: string,
        groups: number[]
    ): string[] {

        const result: string[] = [];
        let position = 0;

        for (const size of groups) {

            if (position >= digits.length) {
                break;
            }

            result.push(
                digits.slice(
                    position,
                    position + size
                )
            );

            position += size;
        }

        if (position < digits.length) {
            result.push(
                digits.slice(position)
            );
        }

        return result;
    }

    /**
     * Valida que un teléfono tenga una cantidad válida
     * de dígitos nacionales.
     */
    isValidPhoneNumber(
        value: string | null | undefined
    ): boolean {

        if (!value) {
            return false;
        }

        const country =
            this.findPhoneCountryFromNumber(value);

        if (!country) {
            return false;
        }

        const national =
            this.extractNationalPhone(value);

        return national.length === country.digits;
    }

    /**
     * Devuelve una representación segura para mostrar en
     * cualquier parte del HTML.
     */
    displayPhone(
        value: string | null | undefined
    ): string {

        if (!value) {
            return '—';
        }

        return this.normalizePhoneNumber(value);
    }

    /**
     * Inicializa el selector de teléfono de creación a partir
     * del valor actual del formulario.
     */
    private initializeCreatePhoneCountry() {

        const phone =
            this.formCreateState['telefono'];

        const code =
            this.getPhoneCodeFromNumber(phone);

        this.createPhoneCountry =
            this.getPhoneCountry(code);

        if (phone) {
            this.formCreateState = {
                ...this.formCreateState,
                telefono:
                    this.normalizePhoneNumber(phone)
            };
        }
    }

    /**
     * Inicializa el selector de teléfono de actualización
     * a partir del registro seleccionado.
     */
    private initializeUpdatePhoneCountry(
        phone: string | null | undefined
    ) {

        const code =
            this.getPhoneCodeFromNumber(phone);

        this.updatePhoneCountry =
            this.getPhoneCountry(code);
    }

    // =========================================================
    // CSV
    // =========================================================

    uploadedCsvFiles = signal<{
        file: File;
        rowCount: number;
        uploadedAt: Date;
    }[]>([]);

    csvError = signal<string | null>(null);
    csvWarning = signal<string | null>(null);

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onFileDrop(event: DragEvent) {

        event.preventDefault();
        this.csvWarning.set('');

        const file = event.dataTransfer?.files?.[0];

        if (!file) return;

        this.csvError.set(null);
        this.multiRows.set([]);

        this.preprocessCsvFile(file);
    }

    onFileSelected(event: Event) {

        const input = event.target as HTMLInputElement;

        this.csvWarning.set('');

        if (!input.files?.length) return;

        const file = input.files[0];

        this.csvError.set(null);
        this.multiRows.set([]);

        this.preprocessCsvFile(file);

        input.value = '';
    }

    preprocessCsvFile(file: File) {

        this.csvError.set(null);

        if (!file.name.toLowerCase().endsWith('.csv')) {

            this.csvError.set(
                'El archivo debe ser formato CSV'
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            try {

                const text = String(reader.result);

                const lines = text
                    .split(/\r?\n/)
                    .filter(l => l.trim().length > 0);

                const rowCount =
                    Math.max(lines.length - 1, 0);

                if (lines.length < 2) {

                    this.csvError.set(
                        'El archivo no contiene registros'
                    );

                    return;
                }

                const headers = lines[0]
                    .split(',')
                    .map(h => h.trim());

                const requiredColumns = [
                    'primer_nombre',
                    'segundo_nombre',
                    'primer_apellido',
                    'segundo_apellido',
                    'telefono'
                ];

                const missing =
                    requiredColumns.filter(
                        col => !headers.includes(col)
                    );

                if (missing.length > 0) {

                    this.csvError.set(
                        `Faltan columnas: ${missing.join(', ')}`
                    );

                    return;
                }

                if (!this.isSameCsv(file)) {

                    this.uploadedCsvFiles.update(files => [
                        {
                            file,
                            uploadedAt: new Date(),
                            rowCount
                        },
                        ...files
                    ]);

                } else {

                    this.csvWarning.set(
                        'El archivo CSV ya fue cargado anteriormente'
                    );

                    return;
                }

            } catch {

                this.csvError.set(
                    'No se pudo analizar el archivo CSV'
                );
            }
        };

        reader.readAsText(file);
    }

    processCsvFile(file: File) {

        this.csvError.set(null);
        this.csvWarning.set(null);

        if (!file.name.toLowerCase().endsWith('.csv')) {

            this.csvError.set(
                'El archivo debe ser formato CSV'
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            try {

                const text = String(reader.result);

                const lines = text
                    .split(/\r?\n/)
                    .filter(l => l.trim().length > 0);

                if (lines.length < 2) {

                    this.csvError.set(
                        'El archivo no contiene registros'
                    );

                    return;
                }

                const headers = lines[0]
                    .split(',')
                    .map(h => h.trim());

                const requiredColumns = [
                    'primer_nombre',
                    'segundo_nombre',
                    'primer_apellido',
                    'segundo_apellido',
                    'telefono'
                ];

                const missing =
                    requiredColumns.filter(
                        col => !headers.includes(col)
                    );

                if (missing.length > 0) {

                    this.csvError.set(
                        `Faltan columnas: ${missing.join(', ')}`
                    );

                    return;
                }

                const rows: Record<string, any>[] = [];

                for (let i = 1; i < lines.length; i++) {

                    const values = lines[i]
                        .split(',')
                        .map(v => v.trim());

                    const row: Record<string, any> = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] ?? '';
                    });

                    if (row['telefono']) {
                        row['telefono'] =
                            this.normalizePhoneNumber(
                                row['telefono']
                            );
                    }

                    rows.push(row);
                }

                this.multiPhoneCountries = {};

                rows.forEach((row, index) => {

                    this.multiPhoneCountries[index] =
                        this.getPhoneCodeFromNumber(
                            row['telefono']
                        );
                });

                this.multiRows.set(rows);

                this.createState.set({
                    open: true,
                    mode: 'multi'
                });

            } catch {

                this.csvError.set(
                    'No se pudo procesar el archivo CSV'
                );
            }
        };

        reader.readAsText(file);
    }

    downloadCsvTemplate() {

        const headers = [
            'primer_nombre',
            'segundo_nombre',
            'primer_apellido',
            'segundo_apellido',
            'telefono'
        ];

        const example = [
            'Marlon',
            'Manuel',
            'Estrada',
            'Sandoval',
            '+505 8269 2155'
        ];

        const csvContent = [
            headers.join(','),
            example.join(',')
        ].join('\n');

        const blob = new Blob(
            [csvContent],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'plantilla_personas.csv';

        link.click();

        URL.revokeObjectURL(url);
    }

    removeUploadedCsv(index: number) {

        const current = this.uploadedCsvFiles();

        current.splice(index, 1);

        this.uploadedCsvFiles.set([...current]);
    }

    handleCsvLoad(input: HTMLInputElement) {

        this.createState.set({
            open: true,
            mode: 'import'
        });
    }

    isSameCsv(file: File): boolean {

        return this.uploadedCsvFiles().some(csv =>
            csv.file.name === file.name &&
            csv.file.size === file.size &&
            csv.file.lastModified === file.lastModified
        );
    }

    // =========================================================
    // STATE
    // =========================================================

    createMode = signal<CreateMode>('menu');

    isCreateModeOpen = signal(false);

    createState = signal<{
        open: boolean;
        mode: CreateMode;
    }>({
        open: false,
        mode: 'menu'
    });

    multiRows = signal<Record<string, any>[]>([]);

    isLoaded = signal(false);
    isApiError = signal(false);

    isOpening = signal(false);
    isClosing = signal(false);
    isDeleting = signal(false);

    isOpeningDialog = signal(false);
    isClosingDialog = signal(false);

    isDeleteOpen = signal(false);
    isDeleteClosing = signal(false);

    isUpdateOpen = signal(false);
    isUpdateClosing = signal(false);
    isUpdating = signal(false);

    isDirty = signal(false);
    isFormValid = signal(false);

    isDiscardWarningOpen = signal(false);

    isCreateOpen = signal(false);
    isSubmitting = signal(false);

    hideGuidColumns = signal(true);

    // =========================================================
    // DATA MODELS
    // =========================================================

    deleteTarget: PersonasResponse | null = null;
    updateTarget: PersonasResponse | null = null;

    updateModel: DynamicCreateModel | null = null;

    createModel: DynamicCreateModel = {

        title: 'Nueva persona',

        endpoint: `/personas`,

        fields: [

            {
                key: 'primer_nombre',
                label: 'Primer nombre',
                type: 'text',
                required: true
            },

            {
                key: 'segundo_nombre',
                label: 'Segundo nombre',
                type: 'text',
                required: true
            },

            {
                key: 'primer_apellido',
                label: 'Primer apellido',
                type: 'text',
                required: true
            },

            {
                key: 'segundo_apellido',
                label: 'Segundo apellido',
                type: 'text',
                required: true
            },

            {
                key: 'telefono',
                label: 'Telefono',
                type: 'phone-country',
                required: true
            },
        ]

    } as DynamicCreateModel;

    formCreateState: Record<string, any> = {};
    formUpdateState: Record<string, any> = {};
    originalFormState: Record<string, any> = {};

    dataSource =
        new MatTableDataSource<PersonasResponse>();

    // =========================================================
    // FILTER STATE
    // =========================================================

    filterEngine = InitializeFilterEngine();

    isFilterOpen = signal(false);
    activeFilterCount = signal(0);
    isFilterDiscardWarningOpen = signal(false);

    filterState =
        this.filterEngine.createState() as PersonaFilter;

    savedFilterState =
        structuredClone(this.filterState);

    readonly filterRules =
        this.filterEngine.rules;

    setRangeValue(
        field: PersonaFilterKey,
        key: 'min' | 'max' | 'from' | 'to',
        raw: string
    ) {

        const current = {
            ...(this.filterState[field] as any)
        };

        if (key === 'min' || key === 'max') {

            current[key] =
                raw === ''
                    ? null
                    : Number(raw);

        } else {

            current[key] = raw;
        }

        this.filterState = {
            ...this.filterState,
            [field]: current
        };
    }

    asRange(value: any): {
        min: number | null;
        max: number | null;
    } {

        return value as {
            min: number | null;
            max: number | null;
        };
    }

    asDateRange(value: any): {
        from: string;
        to: string;
    } {

        return value as {
            from: string;
            to: string;
        };
    }

    getFilterValue(field: PersonaFilterKey) {
        return this.filterState[field];
    }

    setFilterValue(
        field: PersonaFilterKey,
        value: any
    ) {

        this.filterState = {
            ...this.filterState,
            [field]: value
        };
    }

    openFilter() {

        this.isFilterOpen.set(true);
        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    closeFilterDiscardWarning() {
        this.isFilterDiscardWarningOpen.set(false);
    }

    closeFilter(discardConfirmation = false) {

        const changes =
            JSON.stringify(this.filterState) !==
            JSON.stringify(this.savedFilterState);

        if (changes) {

            if (
                this.confirmFilterDiscard(
                    discardConfirmation
                )
            ) {
                return;
            }

            this.isFilterDiscardWarningOpen.set(true);

            return;
        }

        if (
            this.confirmFilterDiscard(
                discardConfirmation
            )
        ) {
            return;
        }

        this.closeModal('filter');
    }

    confirmFilterDiscard(
        discardConfirmation: boolean
    ): boolean {

        if (!discardConfirmation) {
            return false;
        }

        this.filterState =
            structuredClone(this.savedFilterState);

        this.closeFilterDiscardWarning();
        this.closeModal('filter');

        return true;
    }

    applyFilter() {

        const f = this.filterState;

        this.loadFilters(f);

        let count = 0;

        if (f.primer_nombre.length > 0) count++;
        if (f.segundo_nombre.length > 0) count++;
        if (f.primer_apellido.length > 0) count++;
        if (f.segundo_apellido.length > 0) count++;
        if (f.telefono.length > 0) count++;

        this.activeFilterCount.set(count);

        this.savedFilterState =
            structuredClone(this.filterState);

        this.closeFilter();
    }

    // =========================================================
    // FILTERING
    // =========================================================

    searchText = signal('');

    loadFilters(f: PersonaFilter) {

        this.dataSource.filterPredicate =
            (row: PersonasResponse) => {

                // Filtros estructurados del modal (incluye phone-country)
                if (!this.filterEngine.apply(row, this.filterState)) {
                    return false;
                }

                // Búsqueda libre de la caja superior
                const query = this.searchText();

                if (
                    query &&
                    !this.buildSearchText(row).includes(query)
                ) {
                    return false;
                }

                return true;
            };

        this.dataSource.filter =
            this.searchText() || 'active';
    }

    clearFilter() {

        this.filterState = {
            primer_nombre: '',
            segundo_nombre: '',
            primer_apellido: '',
            segundo_apellido: '',
            telefono: ''
        };

        this.savedFilterState =
            structuredClone(this.filterState);

        this.searchText.set('');

        this.dataSource.filter = '';

        this.activeFilterCount.set(0);
    }

    applyGlobalFilter(event: Event) {

        const value =
            (event.target as HTMLInputElement)
                .value
                .trim()
                .toLowerCase();

        this.searchText.set(value);

        this.loadFilters(this.filterState);

        this.dataSource.filter =
            value || 'active';
    }

    private buildSearchText(
        row: PersonasResponse
    ): string {

        return [
            row.primer_nombre,
            row.segundo_nombre,
            row.primer_apellido,
            row.segundo_apellido,
            this.displayPhone(row.telefono)
        ]
            .join(' ')
            .toLowerCase();
    }

    // =========================================================
    // TABLE
    // =========================================================

    get visibleColumns(): string[] {

        if (!this.hideGuidColumns()) {
            return this.displayedColumns;
        }

        return this.displayedColumns.filter(
            col => !this.hiddenColumns.includes(col)
        );
    }

    ventasSchema = InitializeTableSchema();

    get displayedColumns(): string[] {

        return this.ventasSchema.fields
            .filter(
                f =>
                    f.type !== 'actions' ||
                    f.source === 'ui'
            )
            .map(f => f.key as string);
    }

    get columnLabels(): Record<string, string> {

        return Object.fromEntries(
            this.ventasSchema.fields.map(
                f => [f.key, f.label]
            )
        );
    }

    get columnConfig(): Record<
        string,
        { type: string }
    > {

        return Object.fromEntries(
            this.ventasSchema.fields.map(
                f => [
                    f.key,
                    { type: f.type }
                ]
            )
        );
    }

    hiddenColumns = HIDDEN_COLUMNS;

    // =========================================================
    // DATA LOADING
    // =========================================================

    loadData() {

        this.isLoaded.set(false);
        this.isApiError.set(false);

        this.personasService.getPersonas().subscribe({

            next: data => {

                this.dataSource.data =
                    data.map(row => ({
                        ...row,
                        telefono:
                            this.normalizePhoneNumber(
                                row.telefono
                            )
                    }));

                this.isLoaded.set(true);

                if (this.searchText()) {
                    this.loadFilters(
                        this.filterState
                    );
                }
            },

            error: err => {

                console.error(
                    'Error cargando personas',
                    err
                );

                this.isApiError.set(true);
                this.isLoaded.set(false);
            }
        });
    }

    getRowIndex(
        row: PersonasResponse
    ): number {

        return this.dataSource.data
            .indexOf(row) + 1;
    }

    // =========================================================
    // CREATE FLOW
    // =========================================================

    createRandomRow(): Record<string, any> {

        const row =
            InitializeDefaultValues(
                this.createModel
            );

        const phone =
            row['telefono'] ?? '';

        row['telefono'] =
            phone
                ? this.normalizePhoneNumber(phone)
                : '';

        return row;
    }

    addRow() {

        const current = this.multiRows();

        const row =
            this.createRandomRow();

        const nextIndex =
            current.length;

        this.multiPhoneCountries = {
            ...this.multiPhoneCountries,
            [nextIndex]:
                this.getPhoneCodeFromNumber(
                    row['telefono']
                )
        };

        this.multiRows.set([
            ...current,
            row
        ]);
    }

    removeRow(index: number) {

        const current = this.multiRows();

        current.splice(index, 1);

        const countries: Record<number, string> = {};

        current.forEach((row, rowIndex) => {
            countries[rowIndex] =
                this.getPhoneCodeFromNumber(
                    row['telefono']
                );
        });

        this.multiPhoneCountries = countries;

        this.multiRows.set([...current]);
    }

    clearAllRows() {

        this.multiRows.set([]);
        this.multiPhoneCountries = {};
    }

    updateCell(
        rowIndex: number,
        key: string,
        value: any
    ) {

        const rows = this.multiRows();

        if (!rows[rowIndex]) {
            return;
        }

        rows[rowIndex] = {
            ...rows[rowIndex],
            [key]:
                key === 'telefono'
                    ? this.normalizePhoneNumber(value)
                    : value
        };

        this.multiRows.set([...rows]);
    }

    submitMultiCreate() {

        const rows: Record<string, any>[] = this.multiRows();

        if (rows.length === 0) {
            return;
        }

        this.isSubmitting.set(true);

        let completed = 0;
        let hasError = false;

        rows.forEach((row: Record<string, any>) => {

            const payload: CreatePersona = {

                primer_nombre:
                    String(row['primer_nombre'] ?? '').trim(),

                segundo_nombre:
                    String(row['segundo_nombre'] ?? '').trim(),

                primer_apellido:
                    String(row['primer_apellido'] ?? '').trim(),

                segundo_apellido:
                    String(row['segundo_apellido'] ?? '').trim(),

                telefono:
                    String(row['telefono'] ?? '').trim()
            };

            this.personasService
                .createPersona(payload)
                .subscribe({

                    next: () => {

                        completed++;

                        if (completed === rows.length) {

                            this.isSubmitting.set(false);
                            this.isClosing.set(true);

                            setTimeout(() => {

                                this.createState.set({
                                    open: false,
                                    mode: 'multi'
                                });

                                this.multiRows.set([]);

                                this.isClosing.set(false);

                                this.loadData();

                            }, 200);
                        }
                    },

                    error: err => {

                        console.error(
                            'Error creando personas',
                            err
                        );

                        hasError = true;
                        this.isSubmitting.set(false);
                    }
                });
        });
    }

    openCreateMenu() {

        this.createMode.set('menu');
        this.isCreateModeOpen.set(true);
    }

    openCreate(
        mode: CreateMode = 'single'
    ) {

        this.isCreateModeOpen.set(false);

        this.formCreateState =
            InitializeDefaultValues(
                this.createModel
            );

        this.createPhoneCountry =
            this.getPhoneCountry(
                this.defaultPhoneCountryCode
            );

        if (
            this.formCreateState['telefono']
        ) {
            this.initializeCreatePhoneCountry();
        } else {
            this.formCreateState = {
                ...this.formCreateState,
                telefono: ''
            };
        }

        setTimeout(() => {

            if (mode === 'multi') {
                this.multiRows.set([]);
                this.multiPhoneCountries = {};
            }

            this.createState.set({
                open: true,
                mode
            });

            this.isCreateOpen.set(true);

            this.updateFormValidity('create');

            this.isOpening.set(true);

            setTimeout(() => {
                this.isOpening.set(false);
            }, 16);

        }, 60);
    }

    submitCreate() {

        if (!this.isValidPhoneNumber(
            this.formCreateState['telefono']
        )) {
            this.updateFormValidity('create');
            return;
        }

        this.isSubmitting.set(true);

        const payload: CreatePersona = {

            primer_nombre:
                this.formCreateState[
                'primer_nombre'
                ],

            segundo_nombre:
                this.formCreateState[
                'segundo_nombre'
                ],

            primer_apellido:
                this.formCreateState[
                'primer_apellido'
                ],

            segundo_apellido:
                this.formCreateState[
                'segundo_apellido'
                ],

            telefono: this.toBackendPhone(
                this.normalizePhoneNumber(
                    this.formCreateState['telefono']
                )
            )
        };

        this.personasService
            .createPersona(payload)
            .subscribe({

                next: () => {

                    this.isSubmitting.set(false);
                    this.isClosing.set(true);

                    setTimeout(() => {

                        this.createState.set({
                            open: false,
                            mode: 'menu'
                        });

                        this.isClosing.set(false);

                        this.formCreateState = {};

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error creando persona',
                        err
                    );

                    this.isSubmitting.set(false);
                }
            });
    }

    // =========================================================
    // UPDATE FLOW
    // =========================================================

    getUpdatePhoneNumber(): string {
    const phone = this.formUpdateState['telefono'];

        if (!phone) {
            return '';
        }

        const dialCode = this.updatePhoneCountry.code;

        if (phone.startsWith(dialCode)) {
            return phone.slice(dialCode.length).trim();
        }

        return phone;
    }

    updateUser(row: PersonasResponse) {

        this.updateTarget = row;

        this.updateModel = {

            title: 'Actualizar persona',

            endpoint: `/personas`,

            fields: [

                {
                    key: 'primer_nombre',
                    label: 'Primer nombre',
                    type: 'text',
                    required: true
                },

                {
                    key: 'segundo_nombre',
                    label: 'Segundo nombre',
                    type: 'text',
                    required: true
                },

                {
                    key: 'primer_apellido',
                    label: 'Primer apellido',
                    type: 'text',
                    required: true
                },

                {
                    key: 'segundo_apellido',
                    label: 'Segundo apellido',
                    type: 'text',
                    required: true
                },

                {
                    key: 'telefono',
                    label: 'Telefono',
                    type: 'phone-country',
                    required: true
                },
            ]
        };

        this.formUpdateState = {

            primer_nombre:
                row.primer_nombre,

            segundo_nombre:
                row.segundo_nombre,

            primer_apellido:
                row.primer_apellido,

            segundo_apellido:
                row.segundo_apellido,

            telefono:
                this.normalizePhoneNumber(
                    row.telefono
                )

        };

        this.originalFormState =
            structuredClone(
                this.formUpdateState
            );

        this.initializeUpdatePhoneCountry(
            row.telefono
        );

        this.isUpdateOpen.set(true);

        this.updateFormValidity('update');

        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    submitUpdate() {

        if (!this.updateTarget) return;

        if (!this.isValidPhoneNumber(
            this.formUpdateState['telefono']
        )) {
            this.updateFormValidity('update');
            return;
        }

        this.isUpdating.set(true);

        const payload: UpdatePersona = {

            primer_nombre:
                this.formUpdateState[
                'primer_nombre'
                ],

            segundo_nombre:
                this.formUpdateState[
                'segundo_nombre'
                ],

            primer_apellido:
                this.formUpdateState[
                'primer_apellido'
                ],

            segundo_apellido:
                this.formUpdateState[
                'segundo_apellido'
                ],

            telefono: this.toBackendPhone(
                this.normalizePhoneNumber(
                    this.formUpdateState['telefono']
                )
            )
        };

        this.personasService
            .updatePersona(
                payload,
                this.updateTarget.persona_id
            )
            .subscribe({

                next: () => {

                    this.isUpdateClosing.set(true);

                    setTimeout(() => {

                        this.isUpdateOpen.set(false);

                        this.isUpdateClosing.set(false);

                        this.isUpdating.set(false);

                        this.updateTarget = null;

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error actualizando usuario',
                        err
                    );

                    this.isUpdating.set(false);
                }
            });
    }

    // =========================================================
    // DELETE FLOW
    // =========================================================

    deleteUser(row: PersonasResponse) {

        this.deleteTarget = row;

        this.isDeleteOpen.set(true);

        this.isOpening.set(true);

        setTimeout(() => {
            this.isOpening.set(false);
        }, 16);
    }

    confirmDelete() {

        if (!this.deleteTarget) return;

        this.isDeleting.set(true);

        this.personasService
            .deletePersona(
                this.deleteTarget.persona_id
            )
            .subscribe({

                next: () => {

                    this.isDeleteClosing.set(true);

                    setTimeout(() => {

                        this.isDeleteOpen.set(false);

                        this.isDeleteClosing.set(false);

                        this.isDeleting.set(false);

                        this.deleteTarget = null;

                        this.loadData();

                    }, 200);
                },

                error: err => {

                    console.error(
                        'Error eliminando usuario',
                        err
                    );

                    this.isDeleting.set(false);
                }
            });
    }

    closeDeleteModal() {
        this.closeModal('delete');
    }

    // =========================================================
    // FORM CONTROL
    // =========================================================

    setFieldValue(
        key: string,
        value: any,
        action: 'create' | 'update'
    ) {

        if (key === 'telefono') {

            if (action === 'create') {

                const digits =
                    this.extractNationalPhone(value);

                this.formCreateState = {
                    ...this.formCreateState,
                    telefono:
                        this.formatPhoneNumber(
                            this.createPhoneCountry.code,
                            digits
                        )
                };

            } else {

                const digits =
                    this.extractNationalPhone(value);

                this.formUpdateState = {
                    ...this.formUpdateState,
                    telefono:
                        this.formatPhoneNumber(
                            this.updatePhoneCountry.code,
                            digits
                        )
                };
            }

        } else if (action === 'create') {

            this.formCreateState = {
                ...this.formCreateState,
                [key]: value
            };

        } else {

            this.formUpdateState = {
                ...this.formUpdateState,
                [key]: value
            };
        }

        this.isDirty.set(true);

        this.updateDirtyState();

        this.updateFormValidity(action);
    }

    onNumberChange(
        key: string,
        event: Event,
        action: 'create' | 'update'
    ) {

        const value =
            (event.target as HTMLInputElement).value;

        const state =
            action === 'create'
                ? this.formCreateState
                : this.formUpdateState;

        if (value === '') {

            state[key] = '';

            this.updateFormValidity(action);

            return;
        }

        const parsed = Number(value);

        state[key] =
            Number.isNaN(parsed)
                ? 0
                : parsed;

        this.updateFormValidity(action);
    }

    closeModal(
        action: string = 'create',
        mode: string = 'single'
    ) {

        this.isClosing.set(true);

        if (action !== 'delete') {
            this.isFormValid.set(false);
        }

        setTimeout(() => {

            if (action === 'menu') {
                this.isCreateModeOpen.set(false);
            }

            if (action === 'create') {

                this.createState.set({
                    open: false,
                    mode: mode as CreateMode
                });

                this.isCreateOpen.set(false);
            }

            if (action === 'update') {
                this.isUpdateOpen.set(false);
            }

            if (action === 'delete') {
                this.isDeleteOpen.set(false);
            }

            if (action === 'filter') {
                this.isFilterOpen.set(false);
            }

            this.isClosing.set(false);

            if (action !== 'delete') {
                this.isDirty.set(false);
            }

        }, 200);
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private updateFormValidity(
        action: 'create' | 'update'
    ) {

        const model =
            action === 'create'
                ? this.createModel
                : this.updateModel;

        const state =
            action === 'create'
                ? this.formCreateState
                : this.formUpdateState;

        if (!model) {

            this.isFormValid.set(false);

            return;
        }

        for (const field of model.fields) {

            const value =
                state[field.key];

            const isEmpty =
                value === null ||
                value === undefined ||
                value === '';

            if (field.required && isEmpty) {

                this.isFormValid.set(false);

                return;
            }

            if (!field.required && isEmpty) {
                continue;
            }

            if (
                field.type === 'number' ||
                field.type === 'int'
            ) {

                const num =
                    Number(value);

                if (
                    !Number.isFinite(num) ||
                    num <= 0
                ) {

                    this.isFormValid.set(false);

                    return;
                }
            }
        }

        if (
            state['telefono'] &&
            !this.isValidPhoneNumber(
                state['telefono']
            )
        ) {
            this.isFormValid.set(false);
            return;
        }

        this.isFormValid.set(true);
    }

    // =========================================================
    // UPDATE CONTROL
    // =========================================================

    hasChanges(): boolean {

        return JSON.stringify(
            this.formUpdateState
        ) !== JSON.stringify(
            this.originalFormState
        );
    }

    discardChanges() {

        this.closeDiscardWarning();

        this.forceCloseUpdate();
    }

    closeDiscardWarning() {

        this.isClosingDialog.set(true);

        setTimeout(() => {

            this.isClosingDialog.set(false);

            this.isDiscardWarningOpen.set(false);

        }, 200);
    }

    closeUpdateModal(
        action: UpdateModalAction = 'close'
    ) {

        if (action === 'reset') {

            this.formUpdateState =
                structuredClone(
                    this.originalFormState
                );

            this.initializeUpdatePhoneCountry(
                this.formUpdateState[
                'telefono'
                ]
            );

            this.updateFormValidity('update');

            return;
        }

        if (this.hasChanges()) {

            this.isDiscardWarningOpen.set(true);

            this.isOpeningDialog.set(true);

            setTimeout(() => {
                this.isOpeningDialog.set(false);
            }, 16);

            return;
        }

        this.forceCloseUpdate();
    }

    forceCloseUpdate() {
        this.closeModal('update');
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private updateDirtyState() {

        this.isDirty.set(
            JSON.stringify(
                this.formUpdateState
            ) !== JSON.stringify(
                this.originalFormState
            )
        );
    }

    private normalizeBoolean(
        value: any
    ): boolean | null {

        if (
            value === true ||
            value === 1 ||
            value === '1'
        ) {
            return true;
        }

        if (
            value === false ||
            value === 0 ||
            value === '0'
        ) {
            return false;
        }

        if (typeof value === 'string') {

            const normalized =
                value
                    .trim()
                    .toLowerCase();

            if (normalized === 'true') {
                return true;
            }

            if (normalized === 'false') {
                return false;
            }
        }

        return null;
    }

    // =========================================================
    // MENU
    // =========================================================

    activeMenuRow: PersonasResponse | null = null;

    openMenuId: string | null = null;

    menuPosition = {
        top: 0,
        left: 0
    };

    toggleMenu(
        id: string,
        event: MouseEvent,
        row?: PersonasResponse
    ) {

        if (this.openMenuId === id) {

            this.openMenuId = null;
            this.activeMenuRow = null;

            return;
        }

        const btn =
            event.currentTarget as HTMLElement;

        const rect =
            btn.getBoundingClientRect();

        this.menuPosition = {

            top: rect.bottom + 6,

            left: rect.right - 176

        };

        this.openMenuId = id;

        this.activeMenuRow =
            row ?? null;
    }

    closeMenu() {
        this.openMenuId = null;
        this.activeMenuRow = null;
    }
}