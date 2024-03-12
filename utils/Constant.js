const pathEndpoint = {
    serviceImgBase: 'public/Images/service/',
    clientProfileImg: 'assets/images/client/profileImg/',
    beauticianLogo: 'assets/images/beautician/logo/',
    beauticianWorkSpace: 'assets/images/beautician/workSpace/',
    beauticianProfile: 'assets/images/beautician/profileImg/',
    employeeProfile: 'assets/images/beautician/employee/',
    adminProfile: 'public/Images/Profile/'
}

const Constants = {
    serviceImgBase: process.env.BASE_URL + pathEndpoint.serviceImgBase,
    ClientProfileImg: process.env.BASE_URL + pathEndpoint.clientProfileImg,
    beauticianLogo: process.env.BASE_URL + pathEndpoint.beauticianLogo,
    beauticianWorkSpace: process.env.BASE_URL + pathEndpoint.beauticianWorkSpace,
    beauticianProfile: process.env.BASE_URL + pathEndpoint.beauticianProfile,
    EmployeeProfile: process.env.BASE_URL + pathEndpoint.employeeProfile,
    adminProfile: process.env.BASE_URL + pathEndpoint.adminProfile
}

module.exports = { pathEndpoint, Constants }