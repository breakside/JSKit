// #import "DocComponent.js"
/* global JSClass, DocComponent, DocTopicBasedComponent, DocFunction */
'use strict';

 JSClass("DocTopicBasedComponent", DocComponent, {

    topics: null,
    defaultChildKind: null,

    getTitleForDescriptionSection: function(){
        return "Overview";
    },

    nameForMember: function(member){
        if (member.isKindOfClass(DocFunction)){
            var args = member.argumentStrings();
            return "%s(%s)".sprintf(member.name, args.join(", "));
        }
        return member.name;
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocTopicBasedComponent.$super.extractPropertiesFromInfo.call(this, info, documentation);
        this.topics = [];
        if (info.topics){
            for (let i = 0, l = info.topics.length; i < l; ++i){
                let sourceTopic = info.topics[i];
                let topic = {
                    name: sourceTopic.name,
                    summary: sourceTopic.summary,
                    members: []
                };
                this.topics.push(topic);
                if (sourceTopic.members){
                    for (let j = 0, k = sourceTopic.members.length; j < k; ++j){
                        let sourceMember = sourceTopic.members[j];
                        let member = await documentation.createComponentFromInfo(sourceMember, this.sourceURL, this.defaultChildKind);
                        if (member){
                            member.parent = this;
                            if (member.kind == 'constructor' && !member.name){
                                member.name = this.name;
                            }
                            topic.members.push(member);
                            this.children.push(member);
                        }
                    }
                }
            }
        }
    },

    htmlArticleElements: function(document){
        var elements = DocTopicBasedComponent.$super.htmlArticleElements.call(this, document);
        if (this.topics.length > 0){
            var topicsSection = document.createElement("section");
            elements.push(topicsSection);
            topicsSection.setAttribute("class", "topics");
            let header = topicsSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.setAttribute("outline-level", "1");
            h1.appendChild(document.createTextNode("Topics"));
            for (let i = 0, l = this.topics.length; i < l; ++i){
                let topic = this.topics[i];
                if (topic.members.length === 0) continue;
                let section = topicsSection.appendChild(document.createElement("section"));
                section.setAttribute("class", "topic");
                let header = section.appendChild(document.createElement("header"));
                let h1 = header.appendChild(document.createElement("h1"));
                h1.appendChild(document.createTextNode(topic.name));
                h1.setAttribute("outline-level", "2");
                let div = section.appendChild(document.createElement('div'));
                if (topic.summary){
                    let markdown = this.createMarkdownWithString(topic.summary);
                    let children = markdown.htmlElementsForDocument(document);
                    for (let j = 0, k = children.length; j < k; ++j){
                        div.appendChild(children[j]);
                    }
                }
                let list = div.appendChild(document.createElement("ul"));
                list.setAttribute("class", "members");
                for (let j = 0, k = topic.members.length; j < k; ++j){
                    let member = topic.members[j];
                    let item = list.appendChild(document.createElement("li"));
                    item.setAttribute("class", member.kind);
                    let a = document.createElement("a");
                    let url = this.urlForComponent(member);
                    a.setAttribute("href", url.encodedString);
                    if (member.kind == 'framework' || member.kind == 'document'){
                        item.appendChild(a);
                    }else{
                        let code = item.appendChild(document.createElement('code'));
                        let prefix = null;
                        if (member.kind == 'method' || member.kind == 'property'){
                            if (member.isStatic){
                                prefix = 'static';
                            }
                        }
                        if (prefix !== null){
                            code.appendChild(document.createTextNode(prefix + ' '));
                            // let span = a.appendChild(document.createElement('span'));
                            // span.setAttribute("class", "prefix");
                            // span.appendChild(document.createTextNode(prefix + ' '));
                        }
                        code.appendChild(a);
                    }
                    a.appendChild(document.createTextNode(this.nameForMember(member)));
                    if (member.summary){
                        let markdown = this.createMarkdownWithString(member.summary);
                        let children = markdown.htmlElementsForDocument(document);
                        for (let j = 0, k = children.length; j < k; ++j){
                            item.appendChild(children[j]);
                        }

                    }
                }
            }
        }
        return elements;
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let obj = DocFunction.$super.jsonObject.call(this, baseURL);
        if (this.topics.length > 0){
            obj.children = [];
            for (let i = 0, l = this.topics.length; i < l; ++i){
                let topic = this.topics[i];
                if (topic.members.length > 0){
                    obj.children.push({
                        name: topic.name,
                        kind: 'topic'
                    });
                    for (let j = 0, k = topic.members.length; j < k; ++j){
                        let child = topic.members[j].jsonObject(baseURL);
                        obj.children.push(child);
                    }
                }
            }
        }
        return obj;
    }

 });