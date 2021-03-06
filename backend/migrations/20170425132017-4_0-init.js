function createClientConfigs(queryInterface, Sequelize) {
    return queryInterface
        .createTable('ClientConfigs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            managerIp: {
                type: Sequelize.STRING,
                allowNull: false
            },
            config: {
                type: Sequelize.JSON,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        })
        .then(() =>
            queryInterface.addIndex('ClientConfigs', ['managerIp'], {
                indicesType: 'UNIQUE'
            })
        );
}

function createUserAppModel(queryInterface, Sequelize) {
    return queryInterface
        .createTable('UserApps', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            managerIp: { type: Sequelize.STRING, allowNull: false },
            username: { type: Sequelize.STRING, allowNull: false },
            appDataVersion: { type: Sequelize.INTEGER, allowNull: false },
            mode: { type: Sequelize.ENUM, values: ['customer', 'main'], allowNull: false, defaultValue: 'main' },
            role: { type: Sequelize.ENUM, values: ['admin', 'user'], allowNull: false, defaultValue: 'user' },
            appData: { type: Sequelize.JSON, allowNull: false },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        })
        .then(() =>
            queryInterface.addIndex('UserApps', ['managerIp', 'username', 'role', 'mode'], {
                indicesType: 'UNIQUE'
            })
        );
}

function createBlueprintAdditionsModel(queryInterface, Sequelize) {
    return queryInterface
        .createTable('BlueprintAdditions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            blueprintId: { type: Sequelize.STRING, allowNull: false },
            image: { type: Sequelize.BLOB, allowNull: true },
            imageUrl: { type: Sequelize.STRING, allowNull: true },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        })
        .then(() =>
            queryInterface.addIndex('BlueprintAdditions', ['blueprintId'], {
                indicesType: 'UNIQUE'
            })
        );
}

function createApplicationModel(queryInterface, Sequelize) {
    return queryInterface
        .createTable('Applications', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            status: { type: Sequelize.INTEGER },
            isPrivate: { type: Sequelize.BOOLEAN },
            extras: { type: Sequelize.JSON },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        })
        .then(() =>
            queryInterface.addIndex('Applications', ['id'], {
                indicesType: 'UNIQUE'
            })
        );
}

module.exports = {
    up(queryInterface, Sequelize) {
        return createClientConfigs(queryInterface, Sequelize)
            .then(() => createUserAppModel(queryInterface, Sequelize))
            .then(() => createBlueprintAdditionsModel(queryInterface, Sequelize))
            .then(() => createApplicationModel(queryInterface, Sequelize));
    },
    down(queryInterface) {
        return queryInterface
            .dropTable('ClientConfigs')
            .then(() => queryInterface.dropTable('UserApps'))
            .then(() => queryInterface.dropTable('BlueprintAdditions'))
            .then(() => queryInterface.dropTable('Applications'));
    }
};
