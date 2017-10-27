const isDebug = () => process.env.alfred_debug || /^2/.test(process.env.alfred_version);

module.exports = (...args) => process.env.alfred_workflow_name ? 
  (isDebug() ? console.error.apply(this, args) : null) :
  console.log.apply(this, args);
