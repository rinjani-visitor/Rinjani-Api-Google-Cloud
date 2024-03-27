const allEmails = [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL1, process.env.ADMIN_EMAIL2, process.env.ADMIN_EMAIL3, process.env.ADMIN_EMAIL4];

function filterEnvWithValues(arrayofAdmin) {
    const envsWithValues = arrayofAdmin.filter(env => env !== undefined && env !== null && env !== '');

    return envsWithValues;
}

export const adminEmails = filterEnvWithValues(allEmails);
