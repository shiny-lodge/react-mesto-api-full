const Card = require('../models/card');
const NotFoundError = require('../middlewares/errors/not-found-err.js');
const ForbiddenError = require('../middlewares/errors/forbidden-err.js');
const BadRequestError = require('../middlewares/errors/bad-req-err.js');

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;

  return Card.create({ name, owner: req.user._id, link })
    .then((card) => res.send(card))
    .catch(next);
};

module.exports.getCards = (req, res, next) => {
  Card.find({}).then((cards) => {
    res.send(cards);
  }).catch(next);
};

module.exports.deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findById(cardId)
    .orFail(new NotFoundError('Запрашиваемый ресурс не найден'))
    .then((card) => {
      if (!card) throw new BadRequestError('Карточка с таким id не найдена');
      if (card.owner.toString() === req.user._id) {
        Card.findByIdAndRemove(cardId)
          .then((cardToRemove) => res.status(200).send(cardToRemove))
          .catch(next);
      } else {
        throw new ForbiddenError('Вы не можете удалять карточки, которые были созданы не вами');
      }
    })
    .catch(next);
};

module.exports.likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  ).orFail(new NotFoundError('Карточка не найдена')).then((card) => {
    res.send(card);
  }).catch(next);
};
module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  ).orFail(new NotFoundError('Карточка не найдена')).then((card) => {
    res.send(card);
  }).catch(next);
};
