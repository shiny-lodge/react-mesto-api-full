const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const { celebrate, Joi } = require('celebrate');
const cards = require('./routes/cards.js');
const users = require('./routes/users.js');
const { login, createUser } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const NotFoundError = require('./middlewares/errors/not-found-err.js');

const app = express();
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
const { PORT = 3000 } = process.env;

app.use(requestLogger);
app.use(bodyParser.json());

app.get('/api/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/api/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);
app.post('/api/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().pattern(/^(https?:\/\/)?([\da-z\\.-]+)\.([a-z\\.]{2,6})([\\/\w \\.-]*)*\/?$/),
  }),
}), createUser);

app.use('/api/cards*', auth);
app.use('/api', cards);
app.use('/api/users*', auth);
app.use('/api', users);

app.use((req, res, next) => {
  next(new NotFoundError('Запрашиваемый ресурс не найден'));
});

app.use(errorLogger);

app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
});
app.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});
