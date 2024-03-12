const validatelandlineNumber  = (landlineNumber) =>{
    const pattern = /^\d{11}$/;
  
    return pattern.test(landlineNumber);
}

const validateMobileNumber = (landlineNumber) =>{
    const pattern = /^\d{10}$/;
  
    return pattern.test(landlineNumber);
}

const isDateValid =(dateString) =>{
    // This accepts YYYY-MM-DD
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

module.exports = {validatelandlineNumber,validateMobileNumber,isDateValid}