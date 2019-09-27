const { declare } = require('@babel/helper-plugin-utils');
const syntaxTypeScript = require('@babel/plugin-syntax-typescript');
const { types } = require('@babel/core');

// console.log(types.FLIPPED_ALIAS_KEYS);
// process.exit();

function processMemberExpression(path, name, mangled, className) {
    if (path.node.property.name !== name) {
        return;
    }
    console.log('visiting MemberExpression', path.node.object.type, path.node.property.name);

    if (path.node.object.type === 'ThisExpression') {
        path.node.property.name = mangled;
        return;
    }

    if (path.node.object.type === 'Identifier') {
        const binding = path.scope.getBinding(path.node.object.name);
        const identifierTypeAnnotation = binding.identifier.typeAnnotation;
        if (!identifierTypeAnnotation) {
            return;
        }

        const objectTypeName = identifierTypeAnnotation.typeAnnotation.typeName;
        if (objectTypeName && objectTypeName.name === className) {
            path.node.property.name = mangled;
        }
        // console.log(path.node.object.name, objectTypeName, );
    }
}


const updateParamNameVisitor = {
    Identifier(path) {
        if (path.node.name !== this.name) {
            return;
        }

        if (types.isMemberExpression(path.parent)) {
            processMemberExpression(path.parentPath, this.name, this.mangled, this.className);
            return;
        }

        if (path.parentPath.isObjectProperty() && path.parent.key === path.node) {
            const parentVariableDeclarator = path.findParent((path) => path.isVariableDeclarator());

            if (!parentVariableDeclarator) {
                return;
            }

            if (!parentVariableDeclarator.get('init').isThisExpression()) {
                return;
            }
            path.node.name = this.mangled;

        }

        // const parentVariableDeclarator = path.findParent((path) => path.isVariableDeclarator());
        // if (parentVariableDeclarator) {
        //     console.log('in VariableDeclarator');
        // }
        // console.log('end')
        // console.log(parentVariableDeclarator);
        //
        // const binding = path.scope.getBinding(path.node.name);
        //
        // // if (!binding) {
        // //     console.log(path.parent);
        // // }
        // if (binding) {
        //     console.log(path.node, '->', binding.path.node);
        // }
        // console.log('===============');
        // // console.log(binding.path);
    }
};

const visitor = {
    ClassMethod(path){
        if (path.node.accessibility !== 'private') {
            return;
        }

        // TODO: handle static
        if(path.node.static) {
            return;
        }

        const { name } = path.node.key;
        const mangled = path.scope.generateUidIdentifier('').name;


        const classDecl = path.findParent((path) => path.isClassDeclaration());
        const className = classDecl.node.id.name;

        console.log('traversing private method', { name, className });
        classDecl.traverse(updateParamNameVisitor, { name, mangled, className });
        path.node.key.name = mangled;
    },

    ClassProperty(path) {
        if (path.node.accessibility !== 'private') {
            return;
        }

        // TODO: handle static
        if(path.node.static) {
            return;
        }

        const { name } = path.node.key;
        const mangled = path.scope.generateUidIdentifier('').name;


        const classDecl = path.findParent((path) => path.isClassDeclaration());
        const className = classDecl.node.id.name;

        console.log('traversing private property', { name, className });

        classDecl.traverse(updateParamNameVisitor, { name, mangled, className });
        path.node.key.name = mangled;
    },

    // TSParameterProperty(path) {
    //     if (path.node.accessibility !== 'private') {
    //         return;
    //     }
    //
    //     const { name } = path.node.parameter;
    //     const mangled = path.scope.generateUidIdentifier('').name;
    //
    //     const classDecl = path.findParent((path) => path.isClassDeclaration());
    //     const className = classDecl.node.id.name;
    //
    //     console.log('traversing private parameter property', { name, className });
    //     classDecl.traverse(updateParamNameVisitor, { name, mangled, className });
    //     // path.node.parameter.name = mangled;
    //
    //     // path.scope.rename(name, mangled);
    //
    //     // console.log(path.parentPath);
    //     // console.log(path.scope.getBinding(name));
    //     // console.log(path.parentPath.scope.getBinding(name));
    //     // console.log(path.scope.bindings);
    //     // console.log(path.parentPath.get('body')§);
    //
    // }
};


module.exports = declare((api, { }) => {
    api.assertVersion(7);

    return {
        name: 'ts-mangle-private',
        inherits: syntaxTypeScript.default,
        visitor: {
            Program(path) {
                path.traverse(visitor);
            }
        },
    };
});
