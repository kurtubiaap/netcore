package hotspot

import "strings"

const hostPath = "/ip/hotspot/host"

const hostProperties = ".id,mac-address,address,to-address,server,uptime,idle-time,bytes-in,bytes-out,authorized,bypassed,comment"

// Host adalah perangkat yang terdeteksi hotspot, login maupun belum.
type Host struct {
	ID         string `json:"id"`
	MacAddress string `json:"mac_address"`
	Address    string `json:"address"`
	ToAddress  string `json:"to_address"`
	Server     string `json:"server"`
	Uptime     string `json:"uptime"`
	IdleTime   string `json:"idle_time"`
	BytesIn    string `json:"bytes_in"`
	BytesOut   string `json:"bytes_out"`
	Authorized bool   `json:"authorized"`
	Bypassed   bool   `json:"bypassed"`
	Comment    string `json:"comment"`
}

func HostFromRow(row map[string]string) Host {
	return Host{
		ID:         row[".id"],
		MacAddress: row["mac-address"],
		Address:    row["address"],
		ToAddress:  row["to-address"],
		Server:     row["server"],
		Uptime:     row["uptime"],
		IdleTime:   row["idle-time"],
		BytesIn:    row["bytes-in"],
		BytesOut:   row["bytes-out"],
		Authorized: row["authorized"] == "true",
		Bypassed:   row["bypassed"] == "true",
		Comment:    row["comment"],
	}
}

func ListHosts(userID uint, mikrotikID uint64) ([]Host, error) {
	client, err := connect(userID, mikrotikID)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	reply, err := client.Run(hostPath+"/print", "=.proplist="+hostProperties)
	if err != nil {
		return nil, err
	}

	hosts := make([]Host, 0, len(reply.Re))
	for _, row := range reply.Re {
		hosts = append(hosts, HostFromRow(row.Map))
	}

	return hosts, nil
}

// DeleteHost menghapus entri host; host dinamis akan terdeteksi ulang bila perangkat masih aktif.
func DeleteHost(userID uint, mikrotikID uint64, id string) error {
	id = strings.TrimSpace(id)
	if !ValidID(id) {
		return ErrInvalidInput
	}

	client, err := connect(userID, mikrotikID)
	if err != nil {
		return err
	}
	defer client.Close()

	exists, err := itemExists(client, hostPath, id)
	if err != nil {
		return err
	}
	if !exists {
		return ErrHostNotFound
	}

	_, err = client.Run(hostPath+"/remove", "=.id="+id)
	return err
}
