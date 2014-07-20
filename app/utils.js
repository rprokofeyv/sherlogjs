var _         = require('underscore')
  , constants = require('./constants');

_.str = require('underscore.string');

/**
 * Responds a binary file (image)
 *
 * @param   res   obj
 * @return  void
 */
exports.respondPixel = function(res) {
  var buffer = new Buffer(35);
  buffer.write('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');
  res.send(buffer, {'Content-Type': 'image/gif'}, 200);
}

/**
 * Checks whether the request's host is whitelisted
 *
 * @param   whitelist   array
 * @param   host        string
 * @return  boolean
 */
exports.isHostAuthorized = function(whitelist, host) {
  return _.indexOf(whitelist, host);
}

/**
 * Converts date into more human readable format
 *
 * @param   date   obj
 * @return  string
 */
exports.formatDate = function(date) {
  if (typeof date !== 'object') return;
  date = date.toString().split(' ');
  return [date[2], date[1], date[3], date[4]].join(' ');
};

/**
 * Converts tracking data to string and adds comma after each pair
 *
 * @param   obj      obj
 * @return  string
 */
exports.stringify = function(obj) {
  if (typeof obj !== 'object') return;
  var stringify = _.map(obj, function (value, key) {
    // _event key is only used when a string is passed on the client's push method
    if(key==='_event') return _.str.capitalize(value)+'';
    return _.str.capitalize(key)+': '+_.str.capitalize(value);
  });
  return _.str.toSentence(stringify, ', ', ', ');
};

/**
 * Prepares an aggregation array to group events and errors
 *
 * @param   res         obj
 * @param   data        obj
 * @return  array
 */
 exports.aggregate = function(type) {
  var agg     = [];
  var matcher = { $match: { 'type': type } };

  if (type !== constants.tracking_types['all']) {
    agg.push(matcher);
  }

  agg.push({ $sort: { created_at : 1 }},
    { $group: {
        _id: {
          tracking_data   : '$tracking_data',
          environment     : '$environment'
        },
        id          : { $last: '$_id' },
        type        : { $last: '$type' },
        created_at  : { $last: '$created_at' },
        occurence   : { $sum: 1 }
      }
    })

  return agg;
 }

/**
 * Generic stats formatter for presentational reasons
 *
 * @param   data        obj
 * @return  array
 */
exports.formatStats = function(data) {
  return _.each(data, _.bind(function (item) {
    item._id.tracking_data  = item._id.tracking_data.message || this.stringify(item._id.tracking_data);
    item.date = this.formatDate(item.created_at);
    item.type = _.invert(constants.tracking_types)[item.type];
  }, this));
};
