/**
 * Created by pawelposel on 04/11/2016.
 */

Stage.addPlugin({
    id: "serversNum",
    name: "Number of servers",
    description: 'Number of servers',
    initialWidth: 4,
    initialHeight: 2,
    color : "green",
    showHeader: false,
    isReact: true,

    fetchData: function(plugin,context,pluginUtils) {
        return new Promise( (resolve,reject) => {
            pluginUtils.jQuery.get({
                url: context.getManagerUrl('/api/v2.1/node-instances?_include=id'),
                dataType: 'json'
            }).done((nodes)=> {
                resolve({number: nodes.metadata.pagination.total});
            }).fail(reject)
        });
    },

    render: function(widget,data,error,context,pluginUtils) {
        if (!data) {
            return pluginUtils.renderReactLoading();
        }

        if (error) {
            return pluginUtils.renderReactError(error);
        }

        let KeyIndicator = Stage.Basic.KeyIndicator;

        return (
            <KeyIndicator title="Servers" icon="server" number={data.number}/>
        );
    }
});