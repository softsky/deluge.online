module.exports = o => {
    return {
        body: `Здравствуйте!
Социальную сеть Badoo (https://badoo.com) было взломано и украдено данные миллионов учетных записей. Ваша запись есть среди них.
Так как среди украденных данных есть пароли, рекомендуем изменить Ваш пароль по ссылке: https://badoo.com/forgot

Если Вы хотите, чтобы мы бесплатно проверили, была ли утечка Ваших персональных данных на других сайтах, нажмите на ссылку и отправьте нам сгенерированное письмо: http://bit.ly/2VUrTuT
Вы можете добавить своих друзей в список рассылки, но, пожалуйста, не удаляйте последней записи!
В течении 72 часов мы проведем поиск и проинформируем Вас о других проблемах с Вашими персональными данными.

С уважением,
--
Доброжелатель
`,
        cc: o.cc,
        subject: `Измените Ваш пароль в Badoo!`,
        to: o.to
    }
}
