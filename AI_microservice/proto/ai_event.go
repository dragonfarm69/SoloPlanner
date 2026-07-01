// Hand-written companion to the protoc-generated project.pb.go.
// These two messages were added to project.proto after the initial generation.
// They are used only by the Go AI microservice as a gRPC streaming CLIENT;
// the authoritative generated code lives in the Java backend.
//
// When you next regenerate project.pb.go with protoc, delete this file.

package proto

import (
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
)

// AIEventSubscribeRequest is the (empty) request sent by Go when opening the
// SubscribeAIEvents server-streaming call.
type AIEventSubscribeRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *AIEventSubscribeRequest) Reset()         { *x = AIEventSubscribeRequest{} }
func (x *AIEventSubscribeRequest) String() string  { return "AIEventSubscribeRequest{}" }
func (*AIEventSubscribeRequest) ProtoMessage()     {}

// AIEvent is pushed by Java over the open stream each time a user sends an
// AI chat message via WebSocket.
type AIEvent struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	ProjectId     string                 `protobuf:"bytes,1,opt,name=project_id,json=projectId,proto3" json:"project_id,omitempty"`
	UserId        string                 `protobuf:"bytes,2,opt,name=user_id,json=userId,proto3"       json:"user_id,omitempty"`
	Content       string                 `protobuf:"bytes,3,opt,name=content,proto3"                   json:"content,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *AIEvent) Reset()         { *x = AIEvent{} }
func (x *AIEvent) String() string  { return "AIEvent{ProjectId:" + x.ProjectId + "}" }
func (*AIEvent) ProtoMessage()     {}

func (x *AIEvent) GetProjectId() string {
	if x != nil {
		return x.ProjectId
	}
	return ""
}

func (x *AIEvent) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

func (x *AIEvent) GetContent() string {
	if x != nil {
		return x.Content
	}
	return ""
}
