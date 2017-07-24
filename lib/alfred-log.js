module.exports = (...args) => process.env.alfred_workflow_name ? 
  (process.env.alfred_debug ? console.error.apply(this, args) : null) : 
  console.log.apply(this, args);
